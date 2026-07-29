import { Test, TestingModule } from '@nestjs/testing';
import { ProductRequestController } from './product-request.controller';
import { ProductRequestService } from './product-request.service';

describe('ProductRequestController', () => {
  let controller: ProductRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductRequestController],
      providers: [ProductRequestService],
    }).compile();

    controller = module.get<ProductRequestController>(ProductRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
