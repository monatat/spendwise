
package com.spendwise.backend;

import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
public class MongoConnectionTest {

    @Bean
    CommandLineRunner verifyMongoConnection(MongoTemplate mongoTemplate) {
        return args -> {
            String databaseName = mongoTemplate.getDb().getName();

            mongoTemplate.getDb().runCommand(
                    new Document("ping", 1)
            );

            System.out.println(
                    "MongoDB connection successful. Database: "
                            + databaseName
            );
        };
    }
}
