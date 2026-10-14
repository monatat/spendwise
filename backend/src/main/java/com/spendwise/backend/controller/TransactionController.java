
package com.spendwise.backend.controller;

import com.spendwise.backend.model.Transaction;
import com.spendwise.backend.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(
            TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transaction createTransaction(
            @RequestParam String userId,
            @RequestBody Transaction transaction) {
        return transactionService.createTransaction(userId, transaction);
    }

    @GetMapping
    public List<Transaction> getTransactions(
            @RequestParam String userId) {
        return transactionService.getTransactionsByUser(userId);
    }
}
