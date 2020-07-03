import { getRepository } from 'typeorm';

import Category from '../models/Category';

interface RequestDTO {
  title: string;
}

class CreateCategoryService {
  async execute({ title }: RequestDTO): Promise<Category> {
    const categoryRepository = getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({
      where: { title },
    });

    if (!transactionCategory) {
      transactionCategory = await categoryRepository.create({
        title,
      });

      await categoryRepository.save(transactionCategory);
    }

    return transactionCategory;
  }
}

export default CreateCategoryService;
