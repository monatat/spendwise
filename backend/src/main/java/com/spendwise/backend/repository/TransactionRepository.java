
package com.spendwise.backend.repository;

import com.spendwise.backend.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TransactionRepository
        extends MongoRepository<Transaction, String> {

    List<Transaction> findByUserId(String userId);
}
