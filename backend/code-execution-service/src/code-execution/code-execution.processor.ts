import { Process, Processor } from '@nestjs/bull';
import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Job } from 'bull';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

@Processor('code-execution')
export class CodeExecutionProcessor {
  private readonly logger = new Logger(CodeExecutionProcessor.name);
  private readonly PISTON_API_URL = process.env.PISTON_API_URL;
  private readonly QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL;

  private readonly EXECUTION_TIMEOUT = 10000; // 10 seconds
  private readonly MEMORY_LIMIT = 256 * 1024 * 1024; // 256MB in bytes
  private readonly MAX_OUTPUT_LENGTH = 1024 * 1024; // 1MB in bytes
  
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  @Process('execute')
  async handleCodeExecution(job: Job) {
    this.logger.debug(`Processing job ${job.id}`);
    const { questionId, language, code } = job.data;

    try {
      const response = await axios.get(`${this.QUESTION_SERVICE_URL}/Questions/${questionId}`);
      const question = response.data;

      if (!question) {
        throw new Error('Question not found');
      }

      const testCases = question.testCases?.length > 0
        ? question.testCases
        : [{ input: '', expectedOutput: '', description: 'Default test case' }];

      const testResults = await Promise.all(
        testCases.map(async (testCase, index) => {
          return this.executeTestCaseWithRetry(testCase, index, language, code);
        })
      );

      return {
        totalTests: testResults.length,
        passedTests: testResults.filter(test => test.passed).length,
        failedTests: testResults.filter(test => !test.passed).length,
        testResults,
      };

    } catch (error) {
      this.logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  private async executeTestCaseWithRetry(testCase: any, index: number, language: string, code: string, retryCount = 0): Promise<any> {
    try {
      const response = await axios.post(
        `${this.PISTON_API_URL}/execute`,
        {
          language,
          version: this.getLanguageVersion(language),
          files: [
            {
              name: 'source.code',
              content: code,
            },
          ],
          stdin: testCase.input,
          runTimeout: 5000,
          compileTimeout: 10000,
          memoryLimit: this.MEMORY_LIMIT,
        },
        {
          timeout: this.EXECUTION_TIMEOUT,
        }
      );

      const executionResult = {
        output: response.data.run.output,
        stderr: response.data.run.stderr,
        stdout: response.data.run.stdout,
        exitCode: response.data.run.code,
        compile: response.data.compile,
      };

      if (executionResult.stdout.length > this.MAX_OUTPUT_LENGTH) {
        throw new Error('Output size limit exceeded');
      }

      const passed = this.compareOutput(
        executionResult.stdout,
        testCase.expectedOutput
      );

      return {
        testCaseNumber: index + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: executionResult.stdout,
        passed,
        error: executionResult.stderr,
        compilationError: executionResult.compile?.stderr || null,
        executionTime: response.data.run.time,
        memoryUsage: response.data.run.memory,
        retryCount, 
      };

    } catch (error) {
      
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        if (retryCount < this.MAX_RETRIES) {
          
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          this.logger.warn(`Rate limit hit for test case ${index + 1}. Retrying in ${delay}ms...`);
          
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          
          return this.executeTestCaseWithRetry(testCase, index, language, code, retryCount + 1);
        }
      }

      
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        return {
          testCaseNumber: index + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          error: 'Code execution timed out',
          executionTime: this.EXECUTION_TIMEOUT,
          memoryUsage: null,
          retryCount,
        };
      }

      if (error.response?.data?.message?.includes('memory limit exceeded')) {
        return {
          testCaseNumber: index + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          error: 'Memory limit exceeded',
          executionTime: null,
          memoryUsage: this.MEMORY_LIMIT,
          retryCount,
        };
      }

      return {
        testCaseNumber: index + 1,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        passed: false,
        error: error.message || 'Execution failed',
        executionTime: null,
        memoryUsage: null,
        retryCount,
      };
    }
  }

  private getLanguageVersion(language: string): string {
    const languageVersions = {
      python: '3.10',
      javascript: '18.15.0',
      cpp: '10.2.0',
    };

    return languageVersions[language] || 'latest';
  }

  private compareOutput(actual: string, expected: string): boolean {
    const normalizeOutput = (output: string) =>
      output.trim().toLowerCase().replace(/\s+/g, ' ');
    
    return normalizeOutput(actual) === normalizeOutput(expected);
  }
}