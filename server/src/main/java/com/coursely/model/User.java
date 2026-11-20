package com.coursely.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, length = 190) private String email;
    @Column(nullable = false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Role role;
    @Column(length = 120) private String headline = "";
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'ACTIVE'")
    private UserStatus status = UserStatus.ACTIVE;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'APPROVED'")
    private ApprovalStatus approval = ApprovalStatus.APPROVED;
    @Column(length = 500) private String approvalNote;
    @Column(nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected User() {}
    public User(String name, String email, String passwordHash, Role role) {
        this.name = name; this.email = email.toLowerCase(); this.passwordHash = passwordHash; this.role = role;
        // Instructors must be vetted by an admin before they can submit courses for listing.
        this.approval = role == Role.INSTRUCTOR ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { name = v; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; } public void setRole(Role v) { role = v; }
    public UserStatus getStatus() { return status; } public void setStatus(UserStatus v) { status = v; }
    public ApprovalStatus getApproval() { return approval; } public void setApproval(ApprovalStatus v) { approval = v; }
    public String getApprovalNote() { return approvalNote; } public void setApprovalNote(String v) { approvalNote = v; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant v) { createdAt = v; }
    public void setPasswordHash(String v) { passwordHash = v; }
    public String getHeadline() { return headline; }
    public void setHeadline(String v) { headline = v == null ? "" : v; }
}
