
package com.spendwise.backend.repository;

import com.spendwise.backend.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findByUserId(String userId);

    Optional<Transaction> findByIdAndUserId(String id, String userId);

    void deleteByIdAndUserId(String id, String userId);

    boolean existsByUserIdAndCategoryIgnoreCase(String userId, String category);
}
