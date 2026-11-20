package com.coursely.controller;

import com.coursely.repository.CategoryRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/** Public list of category names, used by the catalogue filters and the course editor. */
@RestController @RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryRepository categories;
    public CategoryController(CategoryRepository categories) { this.categories = categories; }

    @GetMapping public List<String> names() { return categories.findAllByOrderByNameAsc().stream().map(c -> c.getName()).toList(); }
}
