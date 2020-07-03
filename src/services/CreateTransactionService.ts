import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import CreateCategoryService from './CreateCategoryService';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const createCategoryService = new CreateCategoryService();

    const newCategory = await createCategoryService.execute({
      title: category,
    });

    const { total } = await transactionRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('The transaction type is invalid.');
    }

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance.');
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: newCategory,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
