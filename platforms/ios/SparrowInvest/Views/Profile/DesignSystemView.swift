//
//  DesignSystemView.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Design System
//  Aligned with Apple Human Interface Guidelines
//

import SwiftUI
import Charts

// MARK: - Design System View

struct DesignSystemView: View {
    @State private var selectedSection: DesignSection = .overview
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Header with Liquid Glass
                liquidGlassHero

                // Section Picker
                sectionPicker

                // Content
                VStack(spacing: 32) {
                    switch selectedSection {
                    case .overview:
                        overviewSection
                    case .tiles:
                        tilesSection
                    case .materials:
                        materialsSection
                    case .colors:
                        colorsSection
                    case .typography:
                        typographySection
                    case .components:
                        componentsSection
                    case .layout:
                        layoutSection
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 40)
            }
        }
        .background(Color(uiColor: .systemBackground))
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Hero Section

extension DesignSystemView {
    private var liquidGlassHero: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color.blue.opacity(0.3),
                    Color.cyan.opacity(0.2),
                    Color.purple.opacity(0.1)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Floating glass circles
            GeometryReader { geometry in
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 120, height: 120)
                    .offset(x: geometry.size.width * 0.7, y: 20)

                Circle()
                    .fill(.thinMaterial)
                    .frame(width: 80, height: 80)
                    .offset(x: 30, y: 60)

                Circle()
                    .fill(.regularMaterial)
                    .frame(width: 60, height: 60)
                    .offset(x: geometry.size.width * 0.5, y: 100)
            }

            VStack(spacing: 16) {
                // App icon with glass effect
                ZStack {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(.ultraThinMaterial)
                        .frame(width: 80, height: 80)
                        .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 10)

                    Image(systemName: "bird.fill")
                        .font(.system(size: 36, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .cyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }

                VStack(spacing: 8) {
                    Text("Sparrow Design")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)

                    Text("iOS 26 Liquid Glass")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.secondary)
                }

                // Version badge with glass
                Text("Aligned with Apple HIG")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
            }
            .padding(.vertical, 40)
        }
        .frame(height: 280)
        .clipShape(RoundedRectangle(cornerRadius: 32, style: .continuous))
        .padding(.horizontal, 20)
        .padding(.top, 20)
    }
}

// MARK: - Section Picker

extension DesignSystemView {
    private var sectionPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(DesignSection.allCases, id: \.self) { section in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedSection = section
                        }
                    } label: {
                        Text(section.rawValue)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(selectedSection == section ? .white : .primary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background {
                                if selectedSection == section {
                                    Capsule()
                                        .fill(Color.blue)
                                } else {
                                    Capsule()
                                        .fill(.ultraThinMaterial)
                                }
                            }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }
}

// MARK: - Overview Section

extension DesignSystemView {
    private var overviewSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            // Introduction
            sectionHeader(title: "Liquid Glass", subtitle: "iOS 26 Design Language")

            Text("Liquid Glass is Apple's new dynamic material that combines the optical properties of glass with a sense of fluidity. It forms a distinct functional layer for controls and navigation elements.")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .lineSpacing(4)

            // Core Principles
            VStack(spacing: 16) {
                PrincipleCard(
                    icon: "square.3.layers.3d",
                    title: "Hierarchy",
                    description: "Establish a clear visual hierarchy where controls and interface elements elevate and distinguish the content beneath them.",
                    color: .blue
                )

                PrincipleCard(
                    icon: "circle.hexagongrid.fill",
                    title: "Harmony",
                    description: "Align with the concentric design of hardware and software to create harmony between interface elements and devices.",
                    color: .purple
                )

                PrincipleCard(
                    icon: "rectangle.on.rectangle",
                    title: "Consistency",
                    description: "Adopt platform conventions to maintain a consistent design that continuously adapts across window sizes and displays.",
                    color: .cyan
                )
            }

            // Key Features
            sectionHeader(title: "Key Features", subtitle: "What's New in iOS 26")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                FeatureCard(icon: "drop.fill", title: "Translucency", description: "Dynamic blur effects")
                FeatureCard(icon: "waveform", title: "Fluidity", description: "Morphing animations")
                FeatureCard(icon: "circle.circle", title: "Concentric", description: "Nested rounded shapes")
                FeatureCard(icon: "arrow.up.and.down.text.horizontal", title: "Extra Large", description: "Bigger touch targets")
            }
        }
    }
}

// MARK: - Tiles Section

extension DesignSystemView {
    private var tilesSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "Tiles", subtitle: "Consistent card system across all screens")

            // 1. Primary Glass Tile
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("1. Primary Glass Tile")
                Text("Use for: Hero cards, dashboard widgets, section containers")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                PrimaryGlassTileDemo()
            }

            // 2. Quick Access Tile
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("2. Quick Access Tile")
                Text("Use for: Points, Find Advisor, action cards")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                HStack(spacing: 12) {
                    QuickAccessTileDemo(
                        icon: "star.fill",
                        iconColor: .yellow,
                        title: "Points",
                        value: "2,450",
                        subtitle: "Gold Tier"
                    )
                    QuickAccessTileDemo(
                        icon: "person.2.fill",
                        iconColor: .blue,
                        title: "Advisors",
                        value: "3 nearby",
                        subtitle: "Browse →"
                    )
                }
            }

            // 3. List Item Tile
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("3. List Item Tile")
                Text("Use for: Menu items, transaction rows, fund items")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                ListItemTileDemo()
            }

            // 4. Category Tile
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("4. Category Tile")
                Text("Use for: Equity, Debt, Hybrid cards, filter chips")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                HStack(spacing: 12) {
                    CategoryTileDemo(icon: "chart.line.uptrend.xyaxis", title: "Equity", color: .blue)
                    CategoryTileDemo(icon: "shield.fill", title: "Debt", color: .green)
                    CategoryTileDemo(icon: "circle.hexagongrid.fill", title: "Hybrid", color: .orange)
                }
            }

            // 5. Stat Badge Tile
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("5. Stat Badge Tile")
                Text("Use for: Returns badges, status pills, percentage indicators")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                HStack(spacing: 12) {
                    StatBadgeTileDemo(value: "+12.4%", isPositive: true)
                    StatBadgeTileDemo(value: "-3.2%", isPositive: false)
                    StatBadgeTileDemo(value: "Verified", isPositive: true, icon: "checkmark.seal.fill")
                }
            }

            // 6. Icon Container
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("6. Icon Container")
                Text("Use for: Icons within tiles, avatar placeholders")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)

                HStack(spacing: 16) {
                    IconContainerDemo(icon: "person.fill", color: .blue, size: 32)
                    IconContainerDemo(icon: "bell.fill", color: .orange, size: 36)
                    IconContainerDemo(icon: "chart.bar.fill", color: .green, size: 48)
                }
            }

            // Specs Table
            VStack(alignment: .leading, spacing: 12) {
                tileTypeLabel("Corner Radius Reference")
                TileSpecsTable()
            }
        }
    }

    private func tileTypeLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.blue)
            .textCase(.uppercase)
    }
}

// MARK: - Tile Demo Components

private struct PrimaryGlassTileDemo: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Portfolio Value")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
                Spacer()
            }
            HStack {
                Text("₹2,45,680")
                    .font(.system(size: 28, weight: .light))
                    .foregroundColor(.primary)
                Spacer()
            }
            HStack(spacing: 6) {
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 12))
                Text("+₹12,450 (5.3%)")
                    .font(.system(size: 14, weight: .regular))
            }
            .foregroundColor(.green)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.green.opacity(colorScheme == .dark ? 0.2 : 0.12), in: Capsule())
        }
        .padding(20)
        .background(primaryBackground)
        .overlay(primaryBorder)
    }

    @ViewBuilder
    private var primaryBackground: some View {
        if colorScheme == .dark {
            // Dark transparent glass with subtle inner glow
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            // Light mode: White background with subtle shadow
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color(uiColor: .white))
                .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 4)
        }
    }

    private var primaryBorder: some View {
        RoundedRectangle(cornerRadius: 24, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.12), location: 0),
                            .init(color: .black.opacity(0.06), location: 0.3),
                            .init(color: .black.opacity(0.04), location: 0.7),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

private struct QuickAccessTileDemo: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    let subtitle: String
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(iconColor.opacity(colorScheme == .dark ? 0.25 : 0.15))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(iconColor)
                }
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.system(size: 18, weight: .semibold))
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(iconColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(quickAccessBackground)
        .overlay(quickAccessBorder)
        .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.15), radius: 12, x: 0, y: 4)
    }

    @ViewBuilder
    private var quickAccessBackground: some View {
        if colorScheme == .dark {
            // Dark transparent glass
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.black.opacity(0.5))
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var quickAccessBorder: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.5), location: 0),
                            .init(color: .white.opacity(0.2), location: 0.25),
                            .init(color: .white.opacity(0.05), location: 0.6),
                            .init(color: .white.opacity(0.15), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

private struct ListItemTileDemo: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 0) {
            listRow(icon: "person.fill", title: "Edit Profile")
            Divider().opacity(colorScheme == .dark ? 0.3 : 1).padding(.leading, 52)
            listRow(icon: "bell.fill", title: "Notifications")
            Divider().opacity(colorScheme == .dark ? 0.3 : 1).padding(.leading, 52)
            listRow(icon: "lock.fill", title: "Security")
        }
        .background(listBackground)
        .overlay(listBorder)
    }

    private func listRow(icon: String, title: String) -> some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.blue.opacity(colorScheme == .dark ? 0.25 : 0.15))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.blue)
            }
            Text(title)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(.primary)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
        }
        .padding(16)
    }

    @ViewBuilder
    private var listBackground: some View {
        if colorScheme == .dark {
            // Dark transparent glass
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.black.opacity(0.5))
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            // Light mode: White with subtle shadow
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: 3)
        }
    }

    private var listBorder: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.12), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

private struct CategoryTileDemo: View {
    let icon: String
    let title: String
    let color: Color
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(categoryBackground)
        .overlay(categoryBorder)
    }

    @ViewBuilder
    private var categoryBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(color.opacity(0.15))
                )
        } else {
            // Light mode: White with color tint
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(color.opacity(0.08))
                )
                .shadow(color: color.opacity(0.15), radius: 8, x: 0, y: 2)
        }
    }

    private var categoryBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: color.opacity(0.5), location: 0),
                            .init(color: color.opacity(0.2), location: 0.5),
                            .init(color: color.opacity(0.3), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: color.opacity(0.25), location: 0),
                            .init(color: color.opacity(0.15), location: 0.5),
                            .init(color: color.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

private struct StatBadgeTileDemo: View {
    let value: String
    let isPositive: Bool
    var icon: String? = nil
    @Environment(\.colorScheme) private var colorScheme

    private var color: Color { isPositive ? .green : .red }

    var body: some View {
        HStack(spacing: 4) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 12))
            }
            Text(value)
                .font(.system(size: 12, weight: .medium))
        }
        .foregroundColor(color)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(color.opacity(colorScheme == .dark ? 0.15 : 0.12), in: Capsule())
    }
}

private struct IconContainerDemo: View {
    let icon: String
    let color: Color
    let size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(color.opacity(0.15))
                .frame(width: size, height: size)
            Image(systemName: icon)
                .font(.system(size: size * 0.4, weight: .medium))
                .foregroundColor(color)
        }
    }
}

private struct TileSpecsTable: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 0) {
            specRow(name: "small", value: "8pt", useCase: "Icon containers")
            Divider().opacity(colorScheme == .dark ? 0.3 : 1)
            specRow(name: "medium", value: "12pt", useCase: "List items")
            Divider().opacity(colorScheme == .dark ? 0.3 : 1)
            specRow(name: "large", value: "16pt", useCase: "Quick access tiles")
            Divider().opacity(colorScheme == .dark ? 0.3 : 1)
            specRow(name: "xLarge", value: "20pt", useCase: "Section cards")
            Divider().opacity(colorScheme == .dark ? 0.3 : 1)
            specRow(name: "xxLarge", value: "24pt", useCase: "Hero cards")
        }
        .background(tableBackground)
        .overlay(tableBorder)
    }

    @ViewBuilder
    private var tableBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.5))
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            // Light mode: White with subtle shadow
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.06), radius: 10, x: 0, y: 3)
        }
    }

    private var tableBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.15), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.08), location: 0),
                            .init(color: .black.opacity(0.04), location: 0.5),
                            .init(color: .black.opacity(0.06), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private func specRow(name: String, value: String, useCase: String) -> some View {
        HStack {
            Text(name)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundColor(.blue)
                .frame(width: 70, alignment: .leading)
            Text(value)
                .font(.system(size: 13, weight: .regular))
                .foregroundColor(.primary)
                .frame(width: 50, alignment: .leading)
            Text(useCase)
                .font(.system(size: 12, weight: .light))
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
    }
}

// MARK: - Materials Section

extension DesignSystemView {
    private var materialsSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "Materials", subtitle: "System-Defined Blur Effects")

            Text("Use system materials to create translucent surfaces that adapt to the content behind them. These materials automatically adjust for light and dark modes.")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .lineSpacing(4)

            // Material Examples
            VStack(spacing: 16) {
                MaterialExample(
                    name: ".ultraThinMaterial",
                    material: .ultraThinMaterial,
                    description: "Lightest blur, maximum transparency"
                )

                MaterialExample(
                    name: ".thinMaterial",
                    material: .thinMaterial,
                    description: "Light blur, good for overlays"
                )

                MaterialExample(
                    name: ".regularMaterial",
                    material: .regularMaterial,
                    description: "Standard blur, balanced opacity"
                )

                MaterialExample(
                    name: ".thickMaterial",
                    material: .thickMaterial,
                    description: "Dense blur, more opaque"
                )

                MaterialExample(
                    name: ".ultraThickMaterial",
                    material: .ultraThickMaterial,
                    description: "Maximum blur, least transparent"
                )
            }

            // Glass Effect Demo
            sectionHeader(title: "Glass Effect", subtitle: "Interactive Demonstration")

            ZStack {
                // Background content
                LinearGradient(
                    colors: [.orange, .pink, .purple],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(height: 200)
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                // Floating glass card
                VStack(spacing: 12) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 28))
                        .foregroundColor(.white)

                    Text("Liquid Glass")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)

                    Text("Content shows through")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(24)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .shadow(color: .black.opacity(0.15), radius: 20, x: 0, y: 10)
            }
        }
    }
}

// MARK: - Colors Section

extension DesignSystemView {
    private var colorsSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "System Colors", subtitle: "Dynamic & Adaptive")

            Text("iOS 26 emphasizes using system colors that automatically adapt to light/dark mode and accessibility settings. Avoid hardcoded color values.")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .lineSpacing(4)

            // Primary Colors
            VStack(alignment: .leading, spacing: 12) {
                Text("Primary Colors")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    SystemColorSwatch(name: "Blue", color: .blue)
                    SystemColorSwatch(name: "Cyan", color: .cyan)
                    SystemColorSwatch(name: "Teal", color: .teal)
                    SystemColorSwatch(name: "Indigo", color: .indigo)
                }
            }

            // Semantic Colors
            VStack(alignment: .leading, spacing: 12) {
                Text("Semantic Colors")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    SystemColorSwatch(name: "Green (Success)", color: .green)
                    SystemColorSwatch(name: "Orange (Warning)", color: .orange)
                    SystemColorSwatch(name: "Red (Error)", color: .red)
                    SystemColorSwatch(name: "Purple (Info)", color: .purple)
                }
            }

            // Label Colors
            VStack(alignment: .leading, spacing: 12) {
                Text("Text & Labels")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 8) {
                    LabelColorRow(name: ".primary", color: .primary)
                    LabelColorRow(name: ".secondary", color: .secondary)
                    LabelColorRow(name: "Color(uiColor: .tertiaryLabel)", textColor: Color(uiColor: .tertiaryLabel))
                    LabelColorRow(name: "Color(uiColor: .quaternaryLabel)", textColor: Color(uiColor: .quaternaryLabel))
                }
            }

            // Background Colors
            VStack(alignment: .leading, spacing: 12) {
                Text("Backgrounds")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 8) {
                    BackgroundColorRow(name: ".systemBackground", color: Color(uiColor: .systemBackground))
                    BackgroundColorRow(name: ".secondarySystemBackground", color: Color(uiColor: .secondarySystemBackground))
                    BackgroundColorRow(name: ".tertiarySystemBackground", color: Color(uiColor: .tertiarySystemBackground))
                    BackgroundColorRow(name: ".systemGroupedBackground", color: Color(uiColor: .systemGroupedBackground))
                }
            }
        }
    }
}

// MARK: - Typography Section

extension DesignSystemView {
    private var typographySection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "Typography", subtitle: "SF Pro & Dynamic Type")

            Text("iOS uses the SF Pro font family with Dynamic Type for accessibility. Always use semantic text styles that scale with user preferences.")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .lineSpacing(4)

            // Text Styles
            VStack(alignment: .leading, spacing: 16) {
                Text("Text Styles")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 12) {
                    TypographyRow(name: ".largeTitle", font: .largeTitle)
                    TypographyRow(name: ".title", font: .title)
                    TypographyRow(name: ".title2", font: .title2)
                    TypographyRow(name: ".title3", font: .title3)
                    TypographyRow(name: ".headline", font: .headline)
                    TypographyRow(name: ".body", font: .body)
                    TypographyRow(name: ".callout", font: .callout)
                    TypographyRow(name: ".subheadline", font: .subheadline)
                    TypographyRow(name: ".footnote", font: .footnote)
                    TypographyRow(name: ".caption", font: .caption)
                    TypographyRow(name: ".caption2", font: .caption2)
                }
            }

            // Font Weights
            VStack(alignment: .leading, spacing: 16) {
                Text("Font Weights")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 8) {
                    FontWeightRow(name: ".ultraLight", weight: .ultraLight)
                    FontWeightRow(name: ".thin", weight: .thin)
                    FontWeightRow(name: ".light", weight: .light)
                    FontWeightRow(name: ".regular", weight: .regular)
                    FontWeightRow(name: ".medium", weight: .medium)
                    FontWeightRow(name: ".semibold", weight: .semibold)
                    FontWeightRow(name: ".bold", weight: .bold)
                    FontWeightRow(name: ".heavy", weight: .heavy)
                    FontWeightRow(name: ".black", weight: .black)
                }
            }

            // Rounded Design
            VStack(alignment: .leading, spacing: 16) {
                Text("Rounded Design")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 12) {
                    HStack {
                        Text("SF Pro Rounded")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                        Spacer()
                        Text(".rounded")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(uiColor: .tertiarySystemFill), in: Capsule())
                    }
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            }
        }
    }
}

// MARK: - Components Section

extension DesignSystemView {
    private var componentsSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "Components", subtitle: "Liquid Glass Controls")

            // Buttons
            VStack(alignment: .leading, spacing: 16) {
                Text("Buttons")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 12) {
                    // Primary Button
                    Button(action: {}) {
                        Text("Primary Action")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .blue.opacity(0.8)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                ),
                                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                            )
                    }

                    // Glass Button
                    Button(action: {}) {
                        Text("Glass Button")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.primary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }

                    // Bordered Button
                    Button(action: {}) {
                        Text("Secondary Action")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.blue)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color.blue.opacity(0.3), lineWidth: 1.5)
                            )
                    }

                    // Small Buttons Row
                    HStack(spacing: 12) {
                        Button(action: {}) {
                            Label("Add", systemImage: "plus")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(.blue, in: Capsule())
                        }

                        Button(action: {}) {
                            Label("Share", systemImage: "square.and.arrow.up")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.primary)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 12)
                                .background(.ultraThinMaterial, in: Capsule())
                        }
                    }
                }
            }

            // Pills & Chips
            VStack(alignment: .leading, spacing: 16) {
                Text("Pills & Chips")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ChipView(text: "All", isSelected: true)
                        ChipView(text: "Equity", isSelected: false)
                        ChipView(text: "Debt", isSelected: false)
                        ChipView(text: "Hybrid", isSelected: false)
                        ChipView(text: "Gold", isSelected: false)
                    }
                }
            }

            // Cards
            VStack(alignment: .leading, spacing: 16) {
                Text("Cards")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                // Glass Card
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Circle()
                            .fill(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 44, height: 44)
                            .overlay {
                                Image(systemName: "chart.line.uptrend.xyaxis")
                                    .font(.system(size: 18, weight: .medium))
                                    .foregroundColor(.white)
                            }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Portfolio Value")
                                .font(.system(size: 15, weight: .semibold))
                            Text("Updated just now")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text("₹12.4L")
                                .font(.system(size: 17, weight: .bold))
                            Text("+12.5%")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.green)
                        }
                    }
                }
                .padding(16)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))

                // Solid Card
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "target")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundColor(.orange)
                            .frame(width: 44, height: 44)
                            .background(Color.orange.opacity(0.15), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Retirement Goal")
                                .font(.system(size: 15, weight: .semibold))
                            Text("75% complete")
                                .font(.system(size: 13))
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }

                    // Progress bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4, style: .continuous)
                                .fill(Color(uiColor: .tertiarySystemFill))
                                .frame(height: 8)

                            RoundedRectangle(cornerRadius: 4, style: .continuous)
                                .fill(LinearGradient(colors: [.orange, .yellow], startPoint: .leading, endPoint: .trailing))
                                .frame(width: geometry.size.width * 0.75, height: 8)
                        }
                    }
                    .frame(height: 8)
                }
                .padding(16)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            }

            // Form Inputs
            VStack(alignment: .leading, spacing: 16) {
                Text("Form Inputs")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 12) {
                    // Text Field
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)
                        Text("Search funds...")
                            .foregroundColor(Color(uiColor: .placeholderText))
                        Spacer()
                    }
                    .padding(16)
                    .background(Color(uiColor: .tertiarySystemFill), in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                    // Segmented Control
                    HStack(spacing: 0) {
                        ForEach(["1M", "3M", "6M", "1Y", "All"], id: \.self) { period in
                            Button(action: {}) {
                                Text(period)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(period == "1Y" ? .white : .primary)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background {
                                        if period == "1Y" {
                                            Capsule()
                                                .fill(.blue)
                                        }
                                    }
                            }
                        }
                    }
                    .padding(4)
                    .background(Color(uiColor: .tertiarySystemFill), in: Capsule())
                }
            }
        }
    }
}

// MARK: - Layout Section

extension DesignSystemView {
    private var layoutSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "Layout", subtitle: "Concentric Design")

            Text("iOS 26 emphasizes concentric design where nested elements follow the curvature of their containers. Corners become rounder as elements nest deeper.")
                .font(.system(size: 15))
                .foregroundColor(.secondary)
                .lineSpacing(4)

            // Corner Radius Scale
            VStack(alignment: .leading, spacing: 16) {
                Text("Corner Radius Scale")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 12) {
                    CornerRadiusRow(radius: 8, name: "Small elements")
                    CornerRadiusRow(radius: 12, name: "Buttons, chips")
                    CornerRadiusRow(radius: 16, name: "Cards, inputs")
                    CornerRadiusRow(radius: 20, name: "Large cards")
                    CornerRadiusRow(radius: 24, name: "Modals, sheets")
                    CornerRadiusRow(radius: 32, name: "Hero sections")
                }
            }

            // Concentric Example
            VStack(alignment: .leading, spacing: 16) {
                Text("Concentric Nesting")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                // Nested containers demo
                VStack(spacing: 16) {
                    Text("Outer Container (radius: 24)")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)

                    VStack(spacing: 12) {
                        Text("Inner Card (radius: 16)")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)

                        HStack(spacing: 8) {
                            Text("Button")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(.blue, in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                            Text("radius: 10")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(Color(uiColor: .tertiarySystemFill), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .padding(20)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            }

            // Spacing System
            VStack(alignment: .leading, spacing: 16) {
                Text("Spacing System")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)

                VStack(spacing: 8) {
                    SpacingRow(value: 4, name: "Micro")
                    SpacingRow(value: 8, name: "Tight")
                    SpacingRow(value: 12, name: "Compact")
                    SpacingRow(value: 16, name: "Standard")
                    SpacingRow(value: 20, name: "Comfortable")
                    SpacingRow(value: 24, name: "Relaxed")
                    SpacingRow(value: 32, name: "Loose")
                }
            }
        }
    }
}

// MARK: - Helper Views

extension DesignSystemView {
    private func sectionHeader(title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.primary)
            Text(subtitle)
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Supporting Views

struct PrincipleCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(color)
                .frame(width: 48, height: 48)
                .background(color.opacity(0.15), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.primary)

                Text(description)
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)
                    .lineSpacing(2)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct FeatureCard: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 24, weight: .medium))
                .foregroundColor(.blue)

            VStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct MaterialExample<S: ShapeStyle>: View where S == Material {
    let name: String
    let material: S
    let description: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                LinearGradient(
                    colors: [.blue, .purple, .pink],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(height: 60)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                Text("Content Behind")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(material, in: Capsule())
            }

            HStack {
                Text(name)
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .foregroundColor(.blue)
                Spacer()
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct SystemColorSwatch: View {
    let name: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(color)
                .frame(height: 60)

            Text(name)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
        }
    }
}

struct LabelColorRow: View {
    let name: String
    var color: Color? = nil
    var textColor: Color? = nil

    var body: some View {
        HStack {
            Text("Sample Text")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(textColor ?? color)

            Spacer()

            Text(name)
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

struct BackgroundColorRow: View {
    let name: String
    let color: Color

    var body: some View {
        HStack {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(color)
                .frame(width: 40, height: 28)
                .overlay {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .stroke(Color(uiColor: .separator), lineWidth: 0.5)
                }

            Text(name)
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(.secondary)

            Spacer()
        }
        .padding(10)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

struct TypographyRow: View {
    let name: String
    let font: Font

    var body: some View {
        HStack {
            Text("Sparrow Invest")
                .font(font)

            Spacer()

            Text(name)
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

struct FontWeightRow: View {
    let name: String
    let weight: Font.Weight

    var body: some View {
        HStack {
            Text("Typography")
                .font(.system(size: 17, weight: weight))

            Spacer()

            Text(name)
                .font(.system(size: 11, design: .monospaced))
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

struct ChipView: View {
    let text: String
    let isSelected: Bool

    var body: some View {
        Text(text)
            .font(.system(size: 14, weight: .semibold))
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background {
                if isSelected {
                    Capsule().fill(.blue)
                } else {
                    Capsule().fill(.ultraThinMaterial)
                }
            }
    }
}

struct CornerRadiusRow: View {
    let radius: CGFloat
    let name: String

    var body: some View {
        HStack(spacing: 16) {
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(LinearGradient(colors: [.blue, .cyan], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 48, height: 48)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(Int(radius))pt")
                    .font(.system(size: 15, weight: .semibold, design: .monospaced))
                Text(name)
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct SpacingRow: View {
    let value: CGFloat
    let name: String

    var body: some View {
        HStack {
            Rectangle()
                .fill(.blue)
                .frame(width: value, height: 24)
                .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))

            Text("\(Int(value))pt")
                .font(.system(size: 13, weight: .semibold, design: .monospaced))

            Text(name)
                .font(.system(size: 13))
                .foregroundColor(.secondary)

            Spacer()
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

// MARK: - Section Enum

enum DesignSection: String, CaseIterable {
    case overview = "Overview"
    case tiles = "Tiles"
    case materials = "Materials"
    case colors = "Colors"
    case typography = "Typography"
    case components = "Components"
    case layout = "Layout"
}

// MARK: - Preview

#Preview {
    NavigationStack {
        DesignSystemView()
    }
}
