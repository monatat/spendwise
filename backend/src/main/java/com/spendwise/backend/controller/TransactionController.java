
package com.spendwise.backend.controller;

import com.spendwise.backend.model.Transaction;
import com.spendwise.backend.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
        @AuthenticationPrincipal String userId,
        @Valid @RequestBody Transaction transaction) {
    return transactionService.createTransaction(userId, transaction);
    }

    @GetMapping
    public List<Transaction> getTransactions(
            @AuthenticationPrincipal String userId) {
        return transactionService.getTransactionsByUser(userId);
    }
    
@PutMapping("/{id}")
public Transaction updateTransaction(
        @AuthenticationPrincipal String userId,
        @PathVariable String id,
        @Valid @RequestBody Transaction transaction) {

    return transactionService.updateTransaction(
            userId, id, transaction);
}

@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void deleteTransaction(
        @AuthenticationPrincipal String userId,
        @PathVariable String id) {

    transactionService.deleteTransaction(userId, id);
}

}
