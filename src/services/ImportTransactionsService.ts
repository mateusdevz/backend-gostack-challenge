import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParser from 'csv-parse';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface RequestDTO {
  filePath: string;
}

interface CSVTransactions {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filePath }: RequestDTO): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const fileStream = fs.createReadStream(filePath);

    const parsers = csvParser({
      from_line: 2,
    });

    const parseCSV = fileStream.pipe(parsers);

    const categories: string[] = [];
    const transactions: CSVTransactions[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentsCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentsCategoriesTitle = existentsCategories.map(
      (category: Category) => category.title,
    );

    const addCategories = categories
      .filter(category => !existentsCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategories.map(category => ({ title: category })),
    );

    await categoryRepository.save(newCategories);

    const allCategories = [...newCategories, ...existentsCategories];

    const importedTransaction = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(importedTransaction);

    await fs.promises.unlink(filePath);

    return importedTransaction;
  }
}

export default ImportTransactionsService;
