package com.coursely.repository;

import com.coursely.model.Role;
import com.coursely.model.User;
import com.coursely.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByRole(Role role);
    long countByRole(Role role);
    long countByRoleAndStatus(Role role, UserStatus status);
    List<User> findTop500ByOrderByCreatedAtDesc();
}
