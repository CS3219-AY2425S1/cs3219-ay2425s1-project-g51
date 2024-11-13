import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model, disconnect, Types } from 'mongoose';
import { QuestionDB } from './questions.model';
import { Question, QuestionSchema } from './schemas/question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionCategory, QuestionComplexity } from './types/question.types';
import { FilterQuestionDto } from './dto/filter-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('QuestionDB Integration Tests', () => {
    let questionDB: QuestionDB;
    let mongoServer: MongoMemoryServer;
    let mongoConnection: Connection;
    let questionModel: Model<Question>;
    let module: TestingModule;
  
    beforeAll(async () => {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      mongoConnection = (await connect(mongoUri)).connection;
  
      module = await Test.createTestingModule({
        imports: [
          MongooseModule.forRoot(mongoUri),
          MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }])
        ],
        providers: [QuestionDB],
      }).compile();
  
      questionDB = module.get<QuestionDB>(QuestionDB);
      questionModel = mongoConnection.model(Question.name, QuestionSchema);
    });
  
    afterAll(async () => {
      await mongoConnection.dropDatabase();
      await mongoConnection.close();
      await mongoServer.stop();
      await module.close();
      await disconnect();
    });
  
    beforeEach(async () => {
      await questionModel.deleteMany({});
    });
  
    describe('createQuestionInDB', () => {
      it('should create a new question in the database', async () => {
        const createQuestionDto: CreateQuestionDto = {
          title: 'Test Question',
          description: 'Test Description',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        };
  
        const createdQuestion = await questionDB.createQuestionInDB(createQuestionDto);
  
        expect(createdQuestion.title).toBe(createQuestionDto.title);
        expect(createdQuestion.description).toBe(createQuestionDto.description);
        expect(createdQuestion.categories).toEqual(createQuestionDto.categories);
        expect(createdQuestion.complexity).toBe(createQuestionDto.complexity);
  
        const foundQuestion = await questionModel.findById(createdQuestion._id);
        expect(foundQuestion).toBeDefined();
        expect(foundQuestion!.title).toBe(createQuestionDto.title);
      });
  
      it('should throw an error if required fields are missing', async () => {
        const invalidDto = {
          title: 'Test Question',
          // missing description, categories, and complexity
        };
  
        await expect(questionDB.createQuestionInDB(invalidDto as CreateQuestionDto)).rejects.toThrow();
      });
    });
  
    describe('findAllQuestionsInDB', () => {
      it('should return all questions from the database', async () => {
        const question1 = new questionModel({
          title: 'Question 1',
          description: 'Description 1',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        const question2 = new questionModel({
          title: 'Question 2',
          description: 'Description 2',
          categories: [QuestionCategory.DATA_STRUCTURES],
          complexity: QuestionComplexity.MEDIUM,
        });
        await question1.save();
        await question2.save();
  
        const questions = await questionDB.findAllQuestionsInDB();
  
        expect(questions).toHaveLength(2);
        expect(questions[0].title).toBe('Question 1');
        expect(questions[1].title).toBe('Question 2');
      });
  
      it('should filter questions based on category', async () => {
        const question1 = new questionModel({
          title: 'Question 1',
          description: 'Description 1',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        const question2 = new questionModel({
          title: 'Question 2',
          description: 'Description 2',
          categories: [QuestionCategory.DATA_STRUCTURES],
          complexity: QuestionComplexity.MEDIUM,
        });
        await question1.save();
        await question2.save();
  
        const filterDto: FilterQuestionDto = {
          categories: [QuestionCategory.ALGORITHMS],
        };
  
        const filteredQuestions = await questionDB.findAllQuestionsInDB(filterDto);
  
        expect(filteredQuestions).toHaveLength(1);
        expect(filteredQuestions[0].title).toBe('Question 1');
      });
  
      it('should filter questions based on complexity', async () => {
        const question1 = new questionModel({
          title: 'Question 1',
          description: 'Description 1',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        const question2 = new questionModel({
          title: 'Question 2',
          description: 'Description 2',
          categories: [QuestionCategory.DATA_STRUCTURES],
          complexity: QuestionComplexity.MEDIUM,
        });
        await question1.save();
        await question2.save();
  
        const filterDto: FilterQuestionDto = {
          complexity: QuestionComplexity.MEDIUM,
        };
  
        const filteredQuestions = await questionDB.findAllQuestionsInDB(filterDto);
  
        expect(filteredQuestions).toHaveLength(1);
        expect(filteredQuestions[0].title).toBe('Question 2');
      });
  
      it('should return an empty array if no questions match the filter', async () => {
        const question = new questionModel({
          title: 'Question 1',
          description: 'Description 1',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        await question.save();
  
        const filterDto: FilterQuestionDto = {
          categories: [QuestionCategory.DATA_STRUCTURES],
          complexity: QuestionComplexity.HARD,
        };
  
        const filteredQuestions = await questionDB.findAllQuestionsInDB(filterDto);
  
        expect(filteredQuestions).toHaveLength(0);
      });
    });
  
    describe('findOneQuestionInDB', () => {
      it('should return a question by ID', async () => {
        const question = new questionModel({
          title: 'Test Question',
          description: 'Test Description',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        await question.save();
  
        const foundQuestion = await questionDB.findOneQuestionInDB(question._id.toString());
  
        expect(foundQuestion).toBeDefined();
        expect(foundQuestion.title).toBe('Test Question');
      });
  
      it('should throw NotFoundException if question is not found', async () => {
        const nonExistentId = new Types.ObjectId().toString();
  
        await expect(questionDB.findOneQuestionInDB(nonExistentId)).rejects.toThrow(NotFoundException);
      });
  
      it('should throw BadRequestException for invalid ID format', async () => {
        const invalidId = 'invalid-id';
  
        await expect(questionDB.findOneQuestionInDB(invalidId)).rejects.toThrow(BadRequestException);
      });
    });
  
    describe('updateQuestionInDB', () => {
      it('should update and return a question', async () => {
        const question = new questionModel({
          title: 'Original Title',
          description: 'Original Description',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        await question.save();
  
        const updateDto: UpdateQuestionDto = {
          title: 'Updated Title',
          complexity: QuestionComplexity.MEDIUM,
        };
  
        const updatedQuestion = await questionDB.updateQuestionInDB(question._id.toString(), updateDto);
  
        expect(updatedQuestion.title).toBe('Updated Title');
        expect(updatedQuestion.complexity).toBe(QuestionComplexity.MEDIUM);
        expect(updatedQuestion.description).toBe('Original Description');
      });
  
      it('should throw NotFoundException if question to update is not found', async () => {
        const nonExistentId = new Types.ObjectId().toString();
        const updateDto: UpdateQuestionDto = { title: 'Updated Title' };
  
        await expect(questionDB.updateQuestionInDB(nonExistentId, updateDto)).rejects.toThrow(NotFoundException);
      });
  
      it('should throw BadRequestException for invalid ID format', async () => {
        const invalidId = 'invalid-id';
        const updateDto: UpdateQuestionDto = { title: 'Updated Title' };
  
        await expect(questionDB.updateQuestionInDB(invalidId, updateDto)).rejects.toThrow(BadRequestException);
      });
  
      it('should not update fields that are not provided in the UpdateQuestionDto', async () => {
        const question = new questionModel({
          title: 'Original Title',
          description: 'Original Description',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        await question.save();
  
        const updateDto: UpdateQuestionDto = {
          title: 'Updated Title',
        };
  
        const updatedQuestion = await questionDB.updateQuestionInDB(question._id.toString(), updateDto);
  
        expect(updatedQuestion.title).toBe('Updated Title');
        expect(updatedQuestion.description).toBe('Original Description');
        expect(updatedQuestion.categories).toEqual([QuestionCategory.ALGORITHMS]);
        expect(updatedQuestion.complexity).toBe(QuestionComplexity.EASY);
      });
    });
  
    describe('removeQuestionInDB', () => {
      it('should remove and return a question', async () => {
        const question = new questionModel({
          title: 'Test Question',
          description: 'Test Description',
          categories: [QuestionCategory.ALGORITHMS],
          complexity: QuestionComplexity.EASY,
        });
        await question.save();
  
        const removedQuestion = await questionDB.removeQuestionInDB(question._id.toString());
  
        expect(removedQuestion).toBeDefined();
        expect(removedQuestion!.title).toBe('Test Question');
  
        const foundQuestion = await questionModel.findById(question._id);
        expect(foundQuestion).toBeNull();
      });
  
      it('should throw NotFoundException if question to remove is not found', async () => {
        const nonExistentId = new Types.ObjectId().toString();
  
        await expect(questionDB.removeQuestionInDB(nonExistentId)).rejects.toThrow(NotFoundException);
      });
  
      it('should throw BadRequestException for invalid ID format', async () => {
        const invalidId = 'invalid-id';
  
        await expect(questionDB.removeQuestionInDB(invalidId)).rejects.toThrow(BadRequestException);
      });
    });

  });
  