package com.coursely.config;

import com.coursely.model.*;
import com.coursely.repository.CategoryRepository;
import com.coursely.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * Runs on every start, independent of demo seeding:
 *  1. makes sure the default categories exist (the course editor requires one of them);
 *  2. creates the first ADMIN from COURSELY_ADMIN_EMAIL / COURSELY_ADMIN_PASSWORD when no admin exists yet.
 * Admins can never self-register, so this (or the demo seed) is how the first one comes into being.
 */
@Component
@Order(2)
public class Bootstrap implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(Bootstrap.class);
    static final List<String> DEFAULT_CATEGORIES = List.of("Art & Design", "Development", "Business", "Marketing", "Data Science", "Photography", "Music", "Communication");

    private final CategoryRepository categories;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String adminEmail, adminPassword, adminName;

    public Bootstrap(CategoryRepository categories, UserRepository users, PasswordEncoder encoder,
                     @Value("${coursely.admin.email:}") String adminEmail, @Value("${coursely.admin.password:}") String adminPassword,
                     @Value("${coursely.admin.name:Platform Admin}") String adminName) {
        this.categories = categories; this.users = users; this.encoder = encoder;
        this.adminEmail = adminEmail; this.adminPassword = adminPassword; this.adminName = adminName;
    }

    @Override @Transactional
    public void run(String... args) {
        if (categories.count() == 0) DEFAULT_CATEGORIES.forEach(n -> categories.save(new Category(n)));
        if (!users.existsByRole(Role.ADMIN) && !adminEmail.isBlank()) {
            if (adminPassword.length() < 12) throw new IllegalStateException("COURSELY_ADMIN_PASSWORD must be at least 12 characters.");
            User a = new User(adminName, adminEmail.trim(), encoder.encode(adminPassword), Role.ADMIN);
            users.save(a);
            log.info("Created initial admin account {}", a.getEmail());
        } else if (!users.existsByRole(Role.ADMIN)) {
            log.warn("No admin account exists. Set COURSELY_ADMIN_EMAIL and COURSELY_ADMIN_PASSWORD (12+ chars) to create one, or enable demo seeding.");
        }
    }
}
