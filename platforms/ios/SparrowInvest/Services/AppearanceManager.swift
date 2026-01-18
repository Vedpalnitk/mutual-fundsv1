//
//  AppearanceManager.swift
//  SparrowInvest
//
//  Manages app appearance mode (dark/light/system)
//

import SwiftUI

enum AppearanceMode: String, CaseIterable {
    case system = "System"
    case light = "Light"
    case dark = "Dark"

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

@MainActor
class AppearanceManager: ObservableObject {
    @AppStorage("appearanceMode") private var storedMode: String = AppearanceMode.system.rawValue

    @Published var currentMode: AppearanceMode = .system {
        didSet {
            storedMode = currentMode.rawValue
        }
    }

    var preferredColorScheme: ColorScheme? {
        currentMode.colorScheme
    }

    init() {
        // Load saved preference
        if let mode = AppearanceMode(rawValue: storedMode) {
            currentMode = mode
        }
    }

    func setMode(_ mode: AppearanceMode) {
        withAnimation(.easeInOut(duration: 0.3)) {
            currentMode = mode
        }
    }
}
