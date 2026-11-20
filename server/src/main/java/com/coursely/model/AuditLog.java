package com.coursely.model;

import jakarta.persistence.*;
import java.time.Instant;

/** Append-only record of sensitive administrative actions. Never updated or deleted by the application. */
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long actorId;
    @Column(length = 190) private String actorEmail;
    @Column(nullable = false, length = 60) private String action;
    @Column(length = 30) private String targetType;
    private Long targetId;
    @Column(length = 500) private String details;
    @Column(nullable = false, updatable = false) private Instant createdAt = Instant.now();

    protected AuditLog() {}
    public AuditLog(User actor, String action, String targetType, Long targetId, String details) {
        if (actor != null) { this.actorId = actor.getId(); this.actorEmail = actor.getEmail(); }
        this.action = action; this.targetType = targetType; this.targetId = targetId;
        this.details = details != null && details.length() > 500 ? details.substring(0, 500) : details;
    }
    public Long getId() { return id; }
    public Long getActorId() { return actorId; }
    public String getActorEmail() { return actorEmail; }
    public String getAction() { return action; }
    public String getTargetType() { return targetType; }
    public Long getTargetId() { return targetId; }
    public String getDetails() { return details; }
    public Instant getCreatedAt() { return createdAt; }
}
