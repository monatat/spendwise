
package com.spendwise.backend.service;

import com.spendwise.backend.model.Transaction;
import com.spendwise.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(
            TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Transaction createTransaction(
            String userId,
            Transaction transaction) {

        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID is required");
        }

        if (transaction.getType() == null ||
                !(transaction.getType().equals("INCOME") ||
                  transaction.getType().equals("EXPENSE"))) {
            throw new IllegalArgumentException(
                    "Type must be INCOME or EXPENSE");
        }

        if (transaction.getAmount() == null ||
                transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Amount must be greater than zero");
        }

        if (transaction.getCategory() == null ||
                transaction.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }

        transaction.setUserId(userId);

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTransactionsByUser(String userId) {
        return transactionRepository.findByUserId(userId);
    }
}
