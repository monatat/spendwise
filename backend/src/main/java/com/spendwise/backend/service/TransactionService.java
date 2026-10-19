
package com.spendwise.backend.service;

import com.spendwise.backend.model.Transaction;
import com.spendwise.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;
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

public Transaction updateTransaction(
        String userId,
        String transactionId,
        Transaction updatedTransaction) {

    Transaction existing = transactionRepository
            .findByIdAndUserId(transactionId, userId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Transaction not found"));

    if (updatedTransaction.getType() == null ||
            !(updatedTransaction.getType().equals("INCOME") ||
              updatedTransaction.getType().equals("EXPENSE"))) {
        throw new IllegalArgumentException(
                "Type must be INCOME or EXPENSE");
    }

    if (updatedTransaction.getAmount() == null ||
            updatedTransaction.getAmount()
                    .compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException(
                "Amount must be greater than zero");
    }

    if (updatedTransaction.getCategory() == null ||
            updatedTransaction.getCategory().isBlank()) {
        throw new IllegalArgumentException("Category is required");
    }

    if (updatedTransaction.getDate() == null) {
        throw new IllegalArgumentException("Date is required");
    }

    existing.setType(updatedTransaction.getType());
    existing.setAmount(updatedTransaction.getAmount());
    existing.setCategory(updatedTransaction.getCategory());
    existing.setDescription(updatedTransaction.getDescription());
    existing.setDate(updatedTransaction.getDate());

    return transactionRepository.save(existing);
}

public void deleteTransaction(String userId, String transactionId) {
    Transaction existing = transactionRepository
            .findByIdAndUserId(transactionId, userId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Transaction not found"));

    transactionRepository.delete(existing);
}
}