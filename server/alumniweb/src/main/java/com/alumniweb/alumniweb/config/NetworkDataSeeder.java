package com.alumniweb.alumniweb.config;

import com.alumniweb.alumniweb.model.*;
import com.alumniweb.alumniweb.model.enums.*;
import com.alumniweb.alumniweb.model.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NetworkDataSeeder implements CommandLineRunner {

    private final MasterAlumniRepository masterAlumniRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final AlumniMessageRepository alumniMessageRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting network data seeder...");
        seedAlumni();
        Map<String, User> demoUsers = seedDemoUsers();
        if (!demoUsers.isEmpty()) {
            seedConnections(demoUsers);
            seedCommunities(demoUsers);
            seedCommunityMessages(demoUsers);
        }
        log.info("Network data seeding complete.");
    }

    private void seedAlumni() {
        if (masterAlumniRepository.findByRegisterNumber("20CS001").isPresent()) {
            log.info("Network demo alumni already seeded, skipping.");
            return;
        }

        record AlumniDef(String reg, String name, String dept, String degree, String batch,
                         Integer yop, String email, String phone, String company, String designation) {}

        AlumniDef[] alumni = {
            new AlumniDef("20CS001", "Ajith Kumar", "CSE", "B.E.", "2020", 2020, "ajith.kumar@example.com", "9876543210", "Google", "Software Engineer"),
            new AlumniDef("20CS002", "Kavitha Rani", "CSE", "B.E.", "2020", 2020, "kavitha.rani@example.com", "9876543211", "Microsoft", "Program Manager"),
            new AlumniDef("20IT001", "Deepak Srinivasan", "IT", "B.Tech", "2020", 2020, "deepak.sri@example.com", "9876543212", "Amazon", "Cloud Engineer"),
            new AlumniDef("20EC001", "Meena Lakshmi", "ECE", "B.E.", "2020", 2020, "meena.lakshmi@example.com", "9876543213", "Qualcomm", "Systems Engineer"),
            new AlumniDef("21CS001", "Ravi Shankar", "CSE", "B.E.", "2021", 2021, "ravi.shankar@example.com", "9876543214", "Infosys", "Developer"),
            new AlumniDef("21CS002", "Sneha Reddy", "CSE", "B.E.", "2021", 2021, "sneha.reddy@example.com", "9876543215", "Wipro", "Analyst"),
            new AlumniDef("21IT001", "Vikram Prabhu", "IT", "B.Tech", "2021", 2021, "vikram.prabhu@example.com", "9876543216", "TCS", "Engineer"),
            new AlumniDef("21EC001", "Anitha Devi", "ECE", "B.E.", "2021", 2021, "anitha.devi@example.com", "9876543217", "Intel", "Firmware Engineer"),
        };

        for (AlumniDef a : alumni) {
            MasterAlumni m = MasterAlumni.builder()
                    .registerNumber(a.reg())
                    .name(a.name())
                    .department(a.dept())
                    .degree(a.degree())
                    .batch(a.batch())
                    .yearOfPassing(a.yop())
                    .email(a.email())
                    .phone(a.phone())
                    .company(a.company())
                    .designation(a.designation())
                    .profession("EMPLOYED")
                    .currentStatus(CurrentStatus.EMPLOYED)
                    .availability(Availability.AVAILABLE)
                    .maritalStatus(MaritalStatus.SINGLE)
                    .gender(Gender.MALE)
                    .dob(LocalDate.of(a.yop() - 21, 6, 15))
                    .address("Coimbatore, Tamil Nadu, India")
                    .build();
            masterAlumniRepository.save(m);
        }
        log.info("Seeded " + alumni.length + " master alumni records.");
    }

    private Map<String, User> seedDemoUsers() {
        Map<String, User> users = new HashMap<>();
        String[] creds = {
            "alumni", "Alumni@123", "20CS001",
            "kavitha", "Kavitha@123", "20CS002",
            "ravi2021", "Ravi@123", "21CS001"
        };
        for (int i = 0; i < creds.length; i += 3) {
            String username = creds[i];
            String password = creds[i + 1];
            String regNumber = creds[i + 2];
            if (userRepository.existsByUsername(username)) {
                userRepository.findByUsername(username).ifPresent(u -> users.put(username, u));
                continue;
            }
            MasterAlumni alumni = masterAlumniRepository.findByRegisterNumber(regNumber).orElse(null);
            if (alumni == null) {
                log.warn("Skipping demo user {} - alumni {} not found.", username, regNumber);
                continue;
            }
            User user = User.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(UserRole.USER)
                    .emailVerified(true)
                    .accountStatus(AccountStatus.ACTIVE)
                    .masterAlumni(alumni)
                    .build();
            userRepository.save(user);
            users.put(username, user);
            log.info("Created demo user: {} / {}", username, password);
        }
        return users;
    }

    private void seedConnections(Map<String, User> users) {
        User alumni = users.get("alumni");
        User kavitha = users.get("kavitha");
        User ravi = users.get("ravi2021");
        if (alumni == null || kavitha == null || ravi == null) {
            log.warn("Skipping connection seeding - demo users missing.");
            return;
        }

        if (connectionRepository.findByRequesterIdAndRecipientId(alumni.getId(), kavitha.getId()).isEmpty()) {
            Connection accepted = Connection.builder()
                    .requesterId(alumni.getId())
                    .recipientId(kavitha.getId())
                    .status("ACCEPTED")
                    .message("Great working with you in the hackathon!")
                    .respondedAt(LocalDateTime.now().minusDays(2))
                    .build();
            connectionRepository.save(accepted);
        }

        if (connectionRepository.findByRequesterIdAndRecipientId(ravi.getId(), alumni.getId()).isEmpty()) {
            Connection pending = Connection.builder()
                    .requesterId(ravi.getId())
                    .recipientId(alumni.getId())
                    .status("PENDING")
                    .message("Hi, I am from the 2021 CSE batch. Let's connect!")
                    .build();
            connectionRepository.save(pending);
        }

        if (connectionRepository.findByRequesterIdAndRecipientId(kavitha.getId(), ravi.getId()).isEmpty()) {
            Connection pending2 = Connection.builder()
                    .requesterId(kavitha.getId())
                    .recipientId(ravi.getId())
                    .status("PENDING")
                    .message("Hello from the 2020 CSE batch!")
                    .build();
            connectionRepository.save(pending2);
        }
        log.info("Seeded demo connections.");
    }

    private void seedCommunities(Map<String, User> users) {
        if (communityRepository.count() > 0) {
            log.info("Communities already seeded, skipping.");
            return;
        }
        User alumni = users.get("alumni");
        User kavitha = users.get("kavitha");
        User ravi = users.get("ravi2021");
        if (alumni == null || kavitha == null || ravi == null) {
            log.warn("Skipping community seeding - demo users missing.");
            return;
        }

        Community cse2020 = Community.builder()
                .name("CSE Batch 2020")
                .description("Community for Computer Science alumni of batch 2020.")
                .batch("2020")
                .department("CSE")
                .createdBy(alumni.getId())
                .isPublic(true)
                .memberCount(2)
                .build();
        communityRepository.save(cse2020);
        communityMemberRepository.save(CommunityMember.builder().community(cse2020).userId(alumni.getId()).role("ADMIN").build());
        communityMemberRepository.save(CommunityMember.builder().community(cse2020).userId(kavitha.getId()).role("MEMBER").build());

        Community batch2021 = Community.builder()
                .name("Batch 2021 Network")
                .description("Networking hub for the 2021 graduating batch.")
                .batch("2021")
                .createdBy(ravi.getId())
                .isPublic(true)
                .memberCount(1)
                .build();
        communityRepository.save(batch2021);
        communityMemberRepository.save(CommunityMember.builder().community(batch2021).userId(ravi.getId()).role("ADMIN").build());

        Community general = Community.builder()
                .name("JJCET Alumni Association")
                .description("Official alumni association for all JJCET graduates.")
                .createdBy(alumni.getId())
                .isPublic(true)
                .memberCount(3)
                .build();
        communityRepository.save(general);
        communityMemberRepository.save(CommunityMember.builder().community(general).userId(alumni.getId()).role("ADMIN").build());
        communityMemberRepository.save(CommunityMember.builder().community(general).userId(kavitha.getId()).role("MEMBER").build());
        communityMemberRepository.save(CommunityMember.builder().community(general).userId(ravi.getId()).role("MEMBER").build());

        log.info("Seeded 3 demo communities.");
    }

    private void seedCommunityMessages(Map<String, User> users) {
        if (alumniMessageRepository.count() > 0) {
            log.info("Messages already seeded, skipping.");
            return;
        }
        User alumni = users.get("alumni");
        User kavitha = users.get("kavitha");
        User ravi = users.get("ravi2021");
        Community cse2020 = communityRepository.findByBatchAndDeletedFalse("2020").stream()
                .filter(c -> "CSE".equals(c.getDepartment())).findFirst().orElse(null);
        Community general = communityRepository.findByDeletedFalse().stream()
                .filter(c -> "JJCET Alumni Association".equals(c.getName())).findFirst().orElse(null);
        if (alumni == null || kavitha == null || cse2020 == null) {
            log.warn("Skipping community message seeding - prerequisites missing.");
            return;
        }

        alumniMessageRepository.save(AlumniMessage.builder()
                .senderId(alumni.getId()).communityId(cse2020.getId())
                .subject("Welcome")
                .body("Welcome to the CSE Batch 2020 community! Feel free to share updates.")
                .messageType("COMMUNITY").build());
        alumniMessageRepository.save(AlumniMessage.builder()
                .senderId(kavitha.getId()).communityId(cse2020.getId())
                .subject("Re: Welcome")
                .body("Thanks! Happy to be part of this community.")
                .messageType("COMMUNITY").build());
        if (general != null) {
            alumniMessageRepository.save(AlumniMessage.builder()
                    .senderId(ravi.getId()).communityId(general.getId())
                    .subject("Reunion")
                    .body("Are we planning a reunion this year?")
                    .messageType("COMMUNITY").build());
        }
        log.info("Seeded demo community messages.");
    }
}
