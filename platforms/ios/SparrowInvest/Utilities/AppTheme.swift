import SwiftUI
import UIKit

enum AppTheme {
    // MARK: - Primary Colors (V4 Design System)
    static let primary = Color(hex: "#2563EB")
    static let primaryDark = Color(hex: "#1D4ED8")
    static let secondary = Color(hex: "#0EA5E9")

    // MARK: - Semantic Colors
    static let success = Color(hex: "#10B981")
    static let warning = Color(hex: "#F59E0B")
    static let error = Color(hex: "#EF4444")

    // MARK: - Text Colors
    static let textPrimary = Color(light: "#1E293B", dark: "#F8FAFC")
    static let textSecondary = Color(light: "#64748B", dark: "#94A3B8")
    static let textTertiary = Color(light: "#94A3B8", dark: "#64748B")

    // MARK: - Background Colors
    static let background = Color(light: "#F8FAFC", dark: "#0F172A")
    static let cardBackground = Color(light: "#FFFFFF", dark: "#1E293B")
    static let inputBackground = Color(light: "#F1F5F9", dark: "#334155")

    // MARK: - Border & Shadow
    static let cardBorder = Color(light: "#E2E8F0", dark: "#334155")
    static let shadowColor = Color.black.opacity(0.08)
    static let progressBackground = Color(light: "#E2E8F0", dark: "#334155")

    // MARK: - Gradients
    static var primaryGradient: LinearGradient {
        LinearGradient(
            colors: [primary, primaryDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var blueGlassGradient: LinearGradient {
        LinearGradient(
            colors: [primary.opacity(0.1), secondary.opacity(0.05)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Color Extensions
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }

    init(light: String, dark: String) {
        self.init(uiColor: UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark
                ? UIColor(Color(hex: dark))
                : UIColor(Color(hex: light))
        })
    }
}

// MARK: - Number Formatting
extension Double {
    var currencyFormatted: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "₹"
        formatter.maximumFractionDigits = 0
        formatter.locale = Locale(identifier: "en_IN")
        return formatter.string(from: NSNumber(value: self)) ?? "₹0"
    }

    var percentFormatted: String {
        return String(format: "%.1f%%", self)
    }
}

extension Int {
    var currencyFormatted: String {
        Double(self).currencyFormatted
    }
}

extension String {
    var currencyFormatted: String {
        if let value = Double(self.replacingOccurrences(of: ",", with: "")) {
            return value.currencyFormatted
        }
        return "₹\(self)"
    }
}
