import SwiftUI
import UIKit

// MARK: - iOS 26 Liquid Glass Theme

enum AppTheme {
    // MARK: - Primary Colors (System-based)
    static let primary = Color.blue
    static let primaryDark = Color(uiColor: .systemBlue).opacity(0.8)
    static let secondary = Color.cyan
    static let accent = Color.teal

    // MARK: - Semantic Colors
    static let success = Color.green
    static let warning = Color.orange
    static let error = Color.red
    static let info = Color.purple

    // MARK: - Text Colors (System Dynamic)
    static let textPrimary = Color.primary
    static let textSecondary = Color.secondary
    static let textTertiary = Color(uiColor: .tertiaryLabel)

    // MARK: - Background Colors (System Dynamic)
    static let background = Color(uiColor: .systemBackground)
    static let secondaryBackground = Color(uiColor: .secondarySystemBackground)
    static let groupedBackground = Color(uiColor: .systemGroupedBackground)
    static let cardBackground = Color(uiColor: .secondarySystemGroupedBackground)

    // MARK: - Fill Colors
    static let primaryFill = Color(uiColor: .systemFill)
    static let secondaryFill = Color(uiColor: .secondarySystemFill)
    static let tertiaryFill = Color(uiColor: .tertiarySystemFill)
    static let quaternaryFill = Color(uiColor: .quaternarySystemFill)

    // MARK: - Border & Separator
    static let separator = Color(uiColor: .separator)
    static let opaqueSeparator = Color(uiColor: .opaqueSeparator)

    // MARK: - Legacy compatibility
    static let inputBackground = Color(uiColor: .tertiarySystemFill)
    static let cardBorder = Color(uiColor: .separator)
    static let chipBackground = Color(uiColor: .tertiarySystemFill)
    static let progressBackground = Color(uiColor: .tertiarySystemFill)
    static let cardShadow = Color.black.opacity(0.06)
    static let shadowColor = Color.black.opacity(0.08)

    // MARK: - Gradients
    static var primaryGradient: LinearGradient {
        LinearGradient(
            colors: [.blue, .cyan],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var successGradient: LinearGradient {
        LinearGradient(
            colors: [.green, .mint],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var warmGradient: LinearGradient {
        LinearGradient(
            colors: [.orange, .yellow],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    static var blueGlassGradient: LinearGradient {
        LinearGradient(
            colors: [Color.blue.opacity(0.1), Color.cyan.opacity(0.05)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Typography (SF Pro Light)
    struct Typography {
        // Display - Large titles
        static func display(_ size: CGFloat = 32) -> Font {
            .system(size: size, weight: .light, design: .default)
        }

        // Title - Section headers
        static func title(_ size: CGFloat = 24) -> Font {
            .system(size: size, weight: .light, design: .default)
        }

        // Headline - Card titles
        static func headline(_ size: CGFloat = 18) -> Font {
            .system(size: size, weight: .regular, design: .default)
        }

        // Body - Main content
        static func body(_ size: CGFloat = 16) -> Font {
            .system(size: size, weight: .light, design: .default)
        }

        // Caption - Secondary text
        static func caption(_ size: CGFloat = 14) -> Font {
            .system(size: size, weight: .light, design: .default)
        }

        // Label - Small labels
        static func label(_ size: CGFloat = 12) -> Font {
            .system(size: size, weight: .regular, design: .default)
        }

        // Numeric - Numbers and stats (rounded design)
        static func numeric(_ size: CGFloat = 20) -> Font {
            .system(size: size, weight: .light, design: .rounded)
        }

        // Bold accent - For emphasis
        static func accent(_ size: CGFloat = 14) -> Font {
            .system(size: size, weight: .medium, design: .default)
        }
    }

    // MARK: - Corner Radii (Concentric Design)
    struct CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
        static let xLarge: CGFloat = 20
        static let xxLarge: CGFloat = 24
        static let hero: CGFloat = 32
    }

    // MARK: - Spacing
    struct Spacing {
        static let micro: CGFloat = 4
        static let small: CGFloat = 8
        static let compact: CGFloat = 12
        static let medium: CGFloat = 16
        static let large: CGFloat = 20
        static let xLarge: CGFloat = 24
        static let xxLarge: CGFloat = 32
    }
}

// MARK: - Glass Card Modifier

struct GlassCard: ViewModifier {
    var cornerRadius: CGFloat = AppTheme.CornerRadius.xLarge
    var material: Material = .regularMaterial

    func body(content: Content) -> some View {
        content
            .background(material, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}

struct SolidCard: ViewModifier {
    var cornerRadius: CGFloat = AppTheme.CornerRadius.xLarge

    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color(uiColor: .secondarySystemGroupedBackground))
            )
    }
}

extension View {
    func glassCard(cornerRadius: CGFloat = AppTheme.CornerRadius.xLarge, material: Material = .regularMaterial) -> some View {
        modifier(GlassCard(cornerRadius: cornerRadius, material: material))
    }

    func solidCard(cornerRadius: CGFloat = AppTheme.CornerRadius.xLarge) -> some View {
        modifier(SolidCard(cornerRadius: cornerRadius))
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

    var compactCurrencyFormatted: String {
        let absValue = abs(self)
        let sign = self < 0 ? "-" : ""

        if absValue >= 10_000_000 { // Crores
            return "\(sign)₹\(String(format: "%.1f", absValue / 10_000_000)) Cr"
        } else if absValue >= 100_000 { // Lakhs
            return "\(sign)₹\(String(format: "%.1f", absValue / 100_000)) L"
        } else if absValue >= 1_000 { // Thousands
            return "\(sign)₹\(String(format: "%.0f", absValue / 1_000))K"
        } else {
            return currencyFormatted
        }
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
