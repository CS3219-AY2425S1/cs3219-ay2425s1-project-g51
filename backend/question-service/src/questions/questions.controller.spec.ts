import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './schemas/question.schema';
import { QuestionCategory, QuestionComplexity } from './types/question.types';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: QuestionsService;

  const mockObjectId = new mongoose.Types.ObjectId();

  const mockQuestion: Question = {
    _id: mockObjectId,
    title: 'Test Question',
    description: 'This is a test question',
    categories: [QuestionCategory.ALGORITHMS],
    complexity: QuestionComplexity.EASY,
  };

  const mockQuestionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [{
        provide: QuestionsService,
        useValue: mockQuestionsService,
      },],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a question', async () => {
      const createQuestionDto: CreateQuestionDto = {
        title: 'New Question',
        description: 'This is a new question',
        categories: [QuestionCategory.ALGORITHMS],
        complexity: QuestionComplexity.EASY,
      };

      mockQuestionsService.create.mockResolvedValue(mockQuestion);

      const result = await controller.create(createQuestionDto);

      expect(result).toEqual(mockQuestion);
      expect(mockQuestionsService.create).toHaveBeenCalledWith(createQuestionDto);
    });

    it('should throw InternalServerErrorException on creation failure', async () => {
      const createQuestionDto: CreateQuestionDto = {
        title: 'New Question',
        description: 'This is a new question',
        categories: [QuestionCategory.ALGORITHMS],
        complexity: QuestionComplexity.EASY,
      };

      mockQuestionsService.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createQuestionDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const mockQuestion3: Partial<Question> = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Third Test Question',
        categories: [QuestionCategory.ALGORITHMS],
        complexity: QuestionComplexity.EASY,
      };
    
      const mockQuestion4: Partial<Question> = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Fourth Test Question',
        categories: [QuestionCategory.DATA_STRUCTURES],
        complexity: QuestionComplexity.MEDIUM,
      };
      
    
      const mockQuestions = [mockQuestion3, mockQuestion4];
      mockQuestionsService.findAll.mockResolvedValue(mockQuestions);

      const result = await controller.findAll();

      expect(result).toEqual(mockQuestions);
      expect(mockQuestionsService.findAll).toHaveBeenCalled();
    });

    it('should filter questions by category and complexity', async () => {
      const mockQuestion3: Partial<Question> = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Third Test Question',
        categories: [QuestionCategory.ALGORITHMS],
        complexity: QuestionComplexity.EASY,
      };
      const mockQuestions = [mockQuestion3];
      mockQuestionsService.findAll.mockResolvedValue(mockQuestions);

      const result = await controller.findAll([QuestionCategory.ALGORITHMS], QuestionComplexity.EASY);

      expect(result).toEqual(mockQuestions);
      expect(mockQuestionsService.findAll).toHaveBeenCalledWith({
        categories: [QuestionCategory.ALGORITHMS],
        complexity: QuestionComplexity.EASY,
      });
    });

    it('should throw InternalServerErrorException on find failure', async () => {
      mockQuestionsService.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    it('should return a question by id', async () => {
      mockQuestionsService.findById.mockResolvedValue(mockQuestion);

      const result = await controller.findOne(mockObjectId.toHexString());

      expect(result).toEqual(mockQuestion);
      expect(mockQuestionsService.findById).toHaveBeenCalledWith(mockObjectId.toHexString());
    });

    it('should throw NotFoundException when question is not found', async () => {
      mockQuestionsService.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(mockObjectId.toHexString())).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id format', async () => {
      mockQuestionsService.findById.mockRejectedValue(new BadRequestException());

      await expect(controller.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockQuestionsService.findById.mockRejectedValue(new Error('Database error'));

      await expect(controller.findOne(mockObjectId.toHexString())).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
      const updateQuestionDto: UpdateQuestionDto = {
        title: 'Updated Question',
      };

      mockQuestionsService.update.mockResolvedValue({ ...mockQuestion, ...updateQuestionDto });

      const result = await controller.update(mockObjectId.toHexString(), updateQuestionDto);

      expect(result).toEqual({ ...mockQuestion, ...updateQuestionDto });
      expect(mockQuestionsService.update).toHaveBeenCalledWith(mockObjectId.toHexString(), updateQuestionDto);
    });

    it('should throw NotFoundException when question is not found', async () => {
      mockQuestionsService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(mockObjectId.toHexString(), {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id format', async () => {
      mockQuestionsService.update.mockRejectedValue(new BadRequestException());

      await expect(controller.update('invalid-id', {})).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockQuestionsService.update.mockRejectedValue(new Error('Database error'));

      await expect(controller.update(mockObjectId.toHexString(), {})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should remove a question', async () => {
      mockQuestionsService.remove.mockResolvedValue(mockQuestion);

      const result = await controller.remove(mockObjectId.toHexString());

      expect(result).toEqual(mockQuestion);
      expect(mockQuestionsService.remove).toHaveBeenCalledWith(mockObjectId.toHexString());
    });

    it('should throw NotFoundException when question is not found', async () => {
      mockQuestionsService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(mockObjectId.toHexString())).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id format', async () => {
      mockQuestionsService.remove.mockRejectedValue(new BadRequestException());

      await expect(controller.remove('invalid-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      mockQuestionsService.remove.mockRejectedValue(new Error('Database error'));

      await expect(controller.remove(mockObjectId.toHexString())).rejects.toThrow(InternalServerErrorException);
    });
  });

});
