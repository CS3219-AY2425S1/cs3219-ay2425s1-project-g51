import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { QuestionDB } from './questions.model';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { FilterQuestionDto } from './dto/filter-question.dto';
import { QuestionCategory, QuestionComplexity } from './types/question.types';
import mongoose from 'mongoose';

jest.mock('./questions.model');

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionDB: jest.Mocked<QuestionDB>;

  const mockObjectId = new mongoose.Types.ObjectId();

  const mockQuestion = {
    _id: mockObjectId,
    title: 'Test Question',
    description: 'This is a test question',
    categories: [QuestionCategory.ALGORITHMS],
    complexity: QuestionComplexity.MEDIUM,
  };

  beforeEach(async () => {
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        QuestionDB,
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    questionDB = module.get(QuestionDB) as jest.Mocked<QuestionDB>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new question', async () => {
      const createQuestionDto: CreateQuestionDto = {
        title: 'New Question',
        description: 'This is a new question',
        categories: [QuestionCategory.ALGORITHMS],
        complexity: QuestionComplexity.EASY,
      };

      questionDB.createQuestionInDB.mockResolvedValue(mockQuestion);

      const result = await service.create(createQuestionDto);

      expect(questionDB.createQuestionInDB).toHaveBeenCalledWith(createQuestionDto);
      expect(result).toEqual(mockQuestion);
    });
  });

  describe('findAll', () => {
    it('should return an array of questions', async () => {
      const filterDto: FilterQuestionDto = {};
      questionDB.findAllQuestionsInDB.mockResolvedValue([mockQuestion]);

      const result = await service.findAll(filterDto);

      expect(questionDB.findAllQuestionsInDB).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual([mockQuestion]);
    });
  });

  describe('findById', () => {
    it('should return a question by id', async () => {
      questionDB.findOneQuestionInDB.mockResolvedValue(mockQuestion);

      const result = await service.findById(mockObjectId.toHexString());

      expect(questionDB.findOneQuestionInDB).toHaveBeenCalledWith(mockObjectId.toHexString());
      expect(result).toEqual(mockQuestion);
    });
  });

  describe('update', () => {
    it('should update a question', async () => {
      const updateQuestionDto: UpdateQuestionDto = {
        title: 'Updated Question',
      };

      questionDB.updateQuestionInDB.mockResolvedValue({ ...mockQuestion, ...updateQuestionDto });

      const result = await service.update(mockObjectId.toHexString(), updateQuestionDto);

      expect(questionDB.updateQuestionInDB).toHaveBeenCalledWith(mockObjectId.toHexString(), updateQuestionDto);
      expect(result).toEqual({ ...mockQuestion, ...updateQuestionDto });
    });
  });

  describe('remove', () => {
    it('should remove a question', async () => {
      questionDB.removeQuestionInDB.mockResolvedValue(mockQuestion);

      const result = await service.remove(mockObjectId.toHexString());

      expect(questionDB.removeQuestionInDB).toHaveBeenCalledWith(mockObjectId.toHexString());
      expect(result).toEqual(mockQuestion);
    });
  });
});
