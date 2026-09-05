package com.alumniweb.alumniweb.service;

import com.alumniweb.alumniweb.dto.dashboard.DashboardResponse;

public interface DashboardService {

    DashboardResponse getDashboard(Long userId);
}
