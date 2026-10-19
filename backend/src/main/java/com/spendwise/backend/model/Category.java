
package com.spendwise.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "categories")
@CompoundIndex(
    name = "user_category_name_unique",
    def = "{'userId': 1, 'name': 1}",
    unique = true
)
public class Category {

    @Id
    private String id;

    private String userId;

    @NotBlank(message = "Category name is required")
    @Size(
        min = 2,
        max = 40,
        message = "Category name must be between 2 and 40 characters"
    )
    private String name;

    @NotBlank(message = "Category type is required")
    @Pattern(
        regexp = "INCOME|EXPENSE",
        message = "Category type must be INCOME or EXPENSE"
    )
    private String type;

    private String color = "#8B5CF6";

    public Category() {
    }

    public Category(String userId, String name, String type, String color) {
        this.userId = userId;
        this.name = name;
        this.type = type;
        this.color = color;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
