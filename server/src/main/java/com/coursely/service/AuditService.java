package com.coursely.service;

import com.coursely.model.AuditLog;
import com.coursely.model.User;
import com.coursely.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

/** Writes audit entries inside the caller's transaction, so an action and its record succeed or fail together. */
@Service
public class AuditService {
    private final AuditLogRepository repo;
    public AuditService(AuditLogRepository repo) { this.repo = repo; }

    public void log(User actor, String action, String targetType, Long targetId, String details) {
        repo.save(new AuditLog(actor, action, targetType, targetId, details));
    }
}
