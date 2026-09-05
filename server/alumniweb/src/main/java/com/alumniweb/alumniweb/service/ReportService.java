package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.admin.AdminDashboardResponse;
import com.alumniweb.alumniweb.dto.admin.ReportSummaryResponse;
import com.alumniweb.alumniweb.model.enums.EventStatus;
import com.alumniweb.alumniweb.model.repository.AnnouncementRepository;
import com.alumniweb.alumniweb.model.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final AdminService adminService;
    private final EventRepository eventRepository;
    private final AnnouncementRepository announcementRepository;

    public ReportSummaryResponse getReportSummary() {
        AdminDashboardResponse dashboard = adminService.getDashboard();
        long upcomingEvents = eventRepository.findByStatusAndEventDateGreaterThanEqualOrderByEventDateAsc(
                EventStatus.PUBLISHED, LocalDateTime.now()).size();
        return new ReportSummaryResponse(
                dashboard.totalAlumni(),
                dashboard.totalRequests(),
                dashboard.pending(),
                upcomingEvents,
                announcementRepository.countByIsActiveTrue()
        );
    }
}
