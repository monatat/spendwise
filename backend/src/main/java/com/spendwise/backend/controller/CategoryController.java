
package com.spendwise.backend.controller;

import com.spendwise.backend.model.Category;
import com.spendwise.backend.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Category> getCategories(
            @AuthenticationPrincipal String userId) {
        return categoryService.getCategories(userId);
    }

    @PostMapping
    public Category createCategory(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody Category category) {
        return categoryService.createCategory(userId, category);
    }

    @PutMapping("/{id}")
    public Category updateCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable String id,
            @Valid @RequestBody Category category) {
        return categoryService.updateCategory(userId, id, category);
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable String id) {
        categoryService.deleteCategory(userId, id);
    }
}
