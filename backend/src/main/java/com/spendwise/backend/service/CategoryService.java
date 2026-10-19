
package com.spendwise.backend.service;

import com.spendwise.backend.model.Category;
import com.spendwise.backend.repository.CategoryRepository;
import com.spendwise.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    private static final Pattern HEX_COLOR =
            Pattern.compile("^#[0-9A-Fa-f]{6}$");

    public CategoryService(
            CategoryRepository categoryRepository,
            TransactionRepository transactionRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<Category> getCategories(String userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId);
    }

    public Category createCategory(String userId, Category category) {
        validateCategory(category);

        String name = category.getName().trim();

        if (categoryRepository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new IllegalArgumentException(
                    "A category with this name already exists.");
        }

        category.setId(null);
        category.setUserId(userId);
        category.setName(name);

        if (category.getColor() == null || category.getColor().isBlank()) {
            category.setColor("#8B5CF6");
        }

        return categoryRepository.save(category);
    }

    public Category updateCategory(
            String userId, String categoryId, Category updatedCategory) {

        validateCategory(updatedCategory);

        Category existing = categoryRepository
                .findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Category not found."));

        String newName = updatedCategory.getName().trim();
        String oldName = existing.getName();

        boolean nameChanged = !oldName.equalsIgnoreCase(newName);

        if (nameChanged
                && categoryRepository.existsByUserIdAndNameIgnoreCase(userId, newName)) {
            throw new IllegalArgumentException(
                    "A category with this name already exists.");
        }

        boolean isUsed = transactionRepository
                .existsByUserIdAndCategoryIgnoreCase(userId, oldName);

        if (isUsed && !existing.getType().equals(updatedCategory.getType())) {
            throw new IllegalArgumentException(
                    "Cannot change the type of a category that is used by transactions.");
        }

        if (isUsed && nameChanged) {
            throw new IllegalArgumentException(
                    "Cannot rename a category that is already used by transactions. "
                            + "Update the related transactions first.");
        }

        existing.setName(newName);
        existing.setType(updatedCategory.getType());
        existing.setColor(
                updatedCategory.getColor() == null
                        || updatedCategory.getColor().isBlank()
                        ? "#8B5CF6"
                        : updatedCategory.getColor()
        );

        return categoryRepository.save(existing);
    }

    public void deleteCategory(String userId, String categoryId) {
        Category category = categoryRepository
                .findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Category not found."));

        boolean isUsed = transactionRepository
                .existsByUserIdAndCategoryIgnoreCase(
                        userId, category.getName());

        if (isUsed) {
            throw new IllegalArgumentException(
                    "Cannot delete this category because transactions still use it.");
        }

        categoryRepository.delete(category);
    }

    private void validateCategory(Category category) {
        if (category == null) {
            throw new IllegalArgumentException("Category data is required.");
        }

        if (category.getName() == null
                || category.getName().isBlank()) {
            throw new IllegalArgumentException("Category name is required.");
        }

        String name = category.getName().trim();

        if (name.length() < 2 || name.length() > 40) {
            throw new IllegalArgumentException(
                    "Category name must be between 2 and 40 characters.");
        }

        if (!"INCOME".equals(category.getType())
                && !"EXPENSE".equals(category.getType())) {
            throw new IllegalArgumentException(
                    "Category type must be INCOME or EXPENSE.");
        }

        if (category.getColor() != null
                && !category.getColor().isBlank()
                && !HEX_COLOR.matcher(category.getColor()).matches()) {
            throw new IllegalArgumentException(
                    "Category color must be a valid hex color, such as #8B5CF6.");
        }
    }
}
