package com.coursely;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import java.util.UUID;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Role, approval and review-workflow rules. Each test creates its own users so tests do not depend on run order. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminRbacTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private JsonNode body(ResultActions r) throws Exception { return json.readTree(r.andReturn().getResponse().getContentAsString()); }

    private String loginToken(String email) throws Exception {
        return "Bearer " + body(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\"}")).andExpect(status().isOk())).get("token").asText();
    }

    private JsonNode register(String role) throws Exception {
        String email = "u" + UUID.randomUUID().toString().substring(0, 8) + "@test.dev";
        return body(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Test User\",\"email\":\"" + email + "\",\"password\":\"Password123!\",\"role\":\"" + role + "\"}")).andExpect(status().isCreated()));
    }

    private static final String COURSE = "{\"title\":\"Test course\",\"category\":\"Business\",\"level\":\"Beginner\",\"description\":\"A long enough description for validation.\","
        + "\"price\":10,\"modules\":[{\"title\":\"M1\",\"lessons\":[{\"title\":\"L1\",\"type\":\"VIDEO\",\"durationMinutes\":5}]}]}";

    private long createCourse(String token) throws Exception {
        return body(mvc.perform(post("/api/instructor/courses").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(COURSE))
            .andExpect(status().isCreated())).get("id").asLong();
    }

    private void setStatus(String token, long id, String status, int expected) throws Exception {
        mvc.perform(patch("/api/instructor/courses/" + id + "/status").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"" + status + "\"}")).andExpect(status().is(expected));
    }

    @Test void studentsAndInstructorsCannotUseAdminEndpoints() throws Exception {
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
        for (String email : new String[]{"student@coursely.dev", "instructor@coursely.dev"})
            mvc.perform(get("/api/admin/users").header("Authorization", loginToken(email))).andExpect(status().isForbidden());
    }

    @Test void adminCanListUsersAndReadReport() throws Exception {
        String admin = loginToken("admin@coursely.dev");
        mvc.perform(get("/api/admin/users").header("Authorization", admin)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/report").header("Authorization", admin)).andExpect(status().isOk()).andExpect(jsonPath("$.admins").exists());
    }

    @Test void selfRegistrationCanNeverCreateAnAdmin() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Sneaky\",\"email\":\"sneaky@test.dev\",\"password\":\"Password123!\",\"role\":\"ADMIN\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("STUDENT"));
    }

    @Test void newInstructorsStartPendingAndCannotSubmitUntilApproved() throws Exception {
        JsonNode reg = register("INSTRUCTOR");
        String t = "Bearer " + reg.get("token").asText();
        org.junit.jupiter.api.Assertions.assertEquals("PENDING", reg.get("user").get("approval").asText());
        long course = createCourse(t);                       // drafting is allowed
        setStatus(t, course, "PENDING_REVIEW", 403);         // submitting is not
        String admin = loginToken("admin@coursely.dev");
        mvc.perform(patch("/api/admin/users/" + reg.get("user").get("id").asLong() + "/approval").header("Authorization", admin)
            .contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVE\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.approval").value("APPROVED"));
        setStatus(t, course, "PENDING_REVIEW", 200);
    }

    @Test void reviewWorkflowRejectThenResubmitThenApprovePublishes() throws Exception {
        String admin = loginToken("admin@coursely.dev");
        String inst = loginToken("daniel@coursely.dev"); // seeded and approved
        long id = createCourse(inst);
        setStatus(inst, id, "PUBLISHED", 400);               // instructors can never publish directly
        setStatus(inst, id, "PENDING_REVIEW", 200);
        mvc.perform(patch("/api/admin/courses/" + id + "/review").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
            .content("{\"decision\":\"REJECT\"}")).andExpect(status().isBadRequest());   // a reason is required
        mvc.perform(patch("/api/admin/courses/" + id + "/review").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
            .content("{\"decision\":\"REJECT\",\"reason\":\"Add more detail to the description.\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(get("/api/instructor/courses/" + id).header("Authorization", inst)).andExpect(jsonPath("$.rejectionReason").value("Add more detail to the description."));
        mvc.perform(get("/api/courses/" + id)).andExpect(status().isNotFound());           // not public while rejected
        setStatus(inst, id, "PENDING_REVIEW", 200);
        mvc.perform(patch("/api/admin/courses/" + id + "/review").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
            .content("{\"decision\":\"APPROVE\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
        mvc.perform(get("/api/courses/" + id)).andExpect(status().isOk());
    }

    @Test void instructorCannotCallReviewEndpoint() throws Exception {
        mvc.perform(patch("/api/admin/courses/1/review").header("Authorization", loginToken("instructor@coursely.dev"))
            .contentType(MediaType.APPLICATION_JSON).content("{\"decision\":\"APPROVE\"}")).andExpect(status().isForbidden());
    }

    @Test void adminCannotChangeOrSuspendSelfAndCannotRemoveLastAdmin() throws Exception {
        String admin = loginToken("admin@coursely.dev");
        long me = body(mvc.perform(get("/api/auth/me").header("Authorization", admin)).andExpect(status().isOk())).get("id").asLong();
        mvc.perform(patch("/api/admin/users/" + me + "/role").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"STUDENT\"}")).andExpect(status().isConflict());
        mvc.perform(patch("/api/admin/users/" + me + "/status").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SUSPENDED\"}")).andExpect(status().isConflict());
        mvc.perform(delete("/api/admin/users/" + me).header("Authorization", admin)).andExpect(status().isConflict());
    }

    @Test void suspendedUserCannotLogInAndExistingTokenStopsWorking() throws Exception {
        JsonNode reg = register("STUDENT");
        String t = "Bearer " + reg.get("token").asText();
        long id = reg.get("user").get("id").asLong();
        mvc.perform(get("/api/enrollments/me").header("Authorization", t)).andExpect(status().isOk());
        String admin = loginToken("admin@coursely.dev");
        mvc.perform(patch("/api/admin/users/" + id + "/status").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SUSPENDED\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/enrollments/me").header("Authorization", t)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + reg.get("user").get("email").asText() + "\",\"password\":\"Password123!\"}")).andExpect(status().isForbidden());
    }

    @Test void roleChangeTakesEffectImmediatelyAndIsAudited() throws Exception {
        JsonNode reg = register("STUDENT");
        String t = "Bearer " + reg.get("token").asText();
        String admin = loginToken("admin@coursely.dev");
        mvc.perform(get("/api/instructor/courses").header("Authorization", t)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/users/" + reg.get("user").get("id").asLong() + "/role").header("Authorization", admin)
            .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"INSTRUCTOR\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/instructor/courses").header("Authorization", t)).andExpect(status().isOk()); // same token, new role
        mvc.perform(get("/api/admin/audit").header("Authorization", admin)).andExpect(status().isOk()).andExpect(jsonPath("$[?(@.action=='ROLE_CHANGED')]").exists());
    }

    @Test void categoriesAreManagedByAdminsAndValidatedOnCourses() throws Exception {
        String admin = loginToken("admin@coursely.dev");
        mvc.perform(post("/api/admin/categories").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Languages\"}"))
            .andExpect(status().is(org.hamcrest.Matchers.anyOf(org.hamcrest.Matchers.is(201), org.hamcrest.Matchers.is(409))));
        mvc.perform(get("/api/categories")).andExpect(status().isOk()).andExpect(jsonPath("$").isArray());
        String inst = loginToken("daniel@coursely.dev");
        mvc.perform(post("/api/instructor/courses").header("Authorization", inst).contentType(MediaType.APPLICATION_JSON)
            .content(COURSE.replace("Business", "Not A Category"))).andExpect(status().isBadRequest());
    }
}
