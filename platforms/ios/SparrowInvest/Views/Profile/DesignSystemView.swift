//
//  DesignSystemView.swift
//  SparrowInvest
//
//  Design System Presentation
//  Crafted by Sparrow Design Studio
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
                // Hero Header
                designHeroHeader

                // Section Picker
                sectionPicker

                // Content
                VStack(spacing: 32) {
                    switch selectedSection {
                    case .overview:
                        overviewSection
                    case .colors:
                        colorsSection
                    case .typography:
                        typographySection
                    case .components:
                        componentsSection
                    case .charts:
                        chartsSection
                    case .tiles:
                        tilesSection
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 24)
                .padding(.bottom, 40)
            }
        }
        .background(SparrowDesign.Colors.background)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Hero Header

    private var designHeroHeader: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    SparrowDesign.Colors.primary,
                    SparrowDesign.Colors.primaryDark
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Pattern overlay
            GeometryReader { geo in
                Path { path in
                    let w = geo.size.width
                    let h = geo.size.height
                    for i in stride(from: 0, to: w, by: 40) {
                        path.move(to: CGPoint(x: i, y: 0))
                        path.addLine(to: CGPoint(x: i + h, y: h))
                    }
                }
                .stroke(Color.white.opacity(0.05), lineWidth: 1)
            }

            VStack(spacing: 16) {
                // Logo
                ZStack {
                    Circle()
                        .fill(Color.white.opacity(0.15))
                        .frame(width: 72, height: 72)

                    Image(systemName: "bird.fill")
                        .font(.system(size: 32, weight: .medium))
                        .foregroundColor(.white)
                }

                VStack(spacing: 8) {
                    Text("SPARROW DESIGN SYSTEM")
                        .font(.system(size: 11, weight: .bold))
                        .tracking(3)
                        .foregroundColor(.white.opacity(0.7))

                    Text("Modern. Clean. Powerful.")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                }

                Text("A Robinhood-inspired design language crafted for\nthe next generation of investment experiences")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 24)
            }
            .padding(.vertical, 40)
        }
        .frame(height: 280)
    }

    // MARK: - Section Picker

    private var sectionPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(DesignSection.allCases, id: \.self) { section in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            selectedSection = section
                        }
                    } label: {
                        Text(section.rawValue)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(selectedSection == section ? .white : SparrowDesign.Colors.textSecondary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(
                                selectedSection == section ?
                                AnyView(
                                    Capsule()
                                        .fill(SparrowDesign.Colors.primary)
                                ) : AnyView(
                                    Capsule()
                                        .stroke(SparrowDesign.Colors.cardBorder, lineWidth: 1)
                                )
                            )
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
        .background(SparrowDesign.Colors.cardBackground)
    }

    // MARK: - Overview Section

    private var overviewSection: some View {
        VStack(alignment: .leading, spacing: 24) {
            sectionHeader(title: "Design Philosophy", subtitle: "Our guiding principles")

            VStack(spacing: 16) {
                principleCard(
                    icon: "sparkles",
                    title: "Clarity First",
                    description: "Every element serves a purpose. We remove visual noise to let data breathe and decisions flow naturally."
                )

                principleCard(
                    icon: "hand.tap.fill",
                    title: "Delightful Interactions",
                    description: "Micro-animations and haptic feedback create a tactile experience that feels alive and responsive."
                )

                principleCard(
                    icon: "accessibility",
                    title: "Accessible by Default",
                    description: "High contrast ratios, scalable typography, and intuitive navigation for everyone."
                )

                principleCard(
                    icon: "chart.line.uptrend.xyaxis",
                    title: "Data-Driven Visuals",
                    description: "Information hierarchy guides the eye. Critical data stands out, context supports."
                )
            }

            // Brand Statement
            VStack(spacing: 16) {
                Text("\"Investing should feel empowering, not overwhelming. Our design makes complex financial data feel approachable and actionable.\"")
                    .font(.system(size: 18, weight: .medium, design: .serif))
                    .italic()
                    .foregroundColor(SparrowDesign.Colors.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)

                Text("— Sparrow Design Studio")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(SparrowDesign.Colors.primary)
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(SparrowDesign.Colors.primary.opacity(0.05))
            )
        }
    }

    // MARK: - Colors Section

    private var colorsSection: some View {
        VStack(alignment: .leading, spacing: 32) {
            // Primary Colors
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Primary Palette", subtitle: "Brand colors that define our identity")

                HStack(spacing: 12) {
                    colorSwatch(
                        color: SparrowDesign.Colors.primary,
                        name: "Sparrow Blue",
                        hex: "#00D09C",
                        isPrimary: true
                    )
                    colorSwatch(
                        color: SparrowDesign.Colors.primaryDark,
                        name: "Deep Blue",
                        hex: "#00B386"
                    )
                }
            }

            // Semantic Colors
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Semantic Colors", subtitle: "Communicating meaning through color")

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    colorSwatch(color: SparrowDesign.Colors.success, name: "Growth Green", hex: "#00D09C")
                    colorSwatch(color: SparrowDesign.Colors.error, name: "Alert Red", hex: "#FF6B6B")
                    colorSwatch(color: SparrowDesign.Colors.warning, name: "Caution Gold", hex: "#FFB800")
                    colorSwatch(color: SparrowDesign.Colors.info, name: "Info Blue", hex: "#5B8DEF")
                }
            }

            // Neutral Colors
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Neutral Palette", subtitle: "Foundation for text and surfaces")

                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        neutralSwatch(color: Color(hex: "#1A1D29"), name: "Ink")
                        neutralSwatch(color: Color(hex: "#2C3142"), name: "Charcoal")
                        neutralSwatch(color: Color(hex: "#6B7280"), name: "Slate")
                    }
                    HStack(spacing: 8) {
                        neutralSwatch(color: Color(hex: "#9CA3AF"), name: "Grey")
                        neutralSwatch(color: Color(hex: "#E5E7EB"), name: "Silver")
                        neutralSwatch(color: Color(hex: "#F9FAFB"), name: "Cloud")
                    }
                }
            }

            // Gradient Showcase
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Gradients", subtitle: "Dynamic color transitions")

                VStack(spacing: 12) {
                    gradientShowcase(
                        gradient: LinearGradient(colors: [SparrowDesign.Colors.primary, SparrowDesign.Colors.primaryDark], startPoint: .leading, endPoint: .trailing),
                        name: "Primary Flow",
                        usage: "CTAs, Hero elements"
                    )

                    gradientShowcase(
                        gradient: LinearGradient(colors: [SparrowDesign.Colors.success, Color(hex: "#00B386")], startPoint: .leading, endPoint: .trailing),
                        name: "Success Wave",
                        usage: "Positive indicators"
                    )

                    gradientShowcase(
                        gradient: LinearGradient(colors: [Color(hex: "#667EEA"), Color(hex: "#764BA2")], startPoint: .leading, endPoint: .trailing),
                        name: "Premium Glow",
                        usage: "Featured content"
                    )
                }
            }
        }
    }

    // MARK: - Typography Section

    private var typographySection: some View {
        VStack(alignment: .leading, spacing: 32) {
            sectionHeader(title: "Typography Scale", subtitle: "SF Pro – Apple's system font for clarity")

            // Type Scale
            VStack(alignment: .leading, spacing: 20) {
                typeScaleRow(name: "Display", size: 34, weight: .bold, sample: "₹24,56,780")
                typeScaleRow(name: "Title 1", size: 28, weight: .bold, sample: "Portfolio Value")
                typeScaleRow(name: "Title 2", size: 22, weight: .semibold, sample: "Today's Movers")
                typeScaleRow(name: "Title 3", size: 18, weight: .semibold, sample: "Asset Allocation")
                typeScaleRow(name: "Body", size: 16, weight: .regular, sample: "Your investments are performing well")
                typeScaleRow(name: "Callout", size: 14, weight: .medium, sample: "View detailed analysis →")
                typeScaleRow(name: "Caption", size: 12, weight: .regular, sample: "Updated 2 minutes ago")
                typeScaleRow(name: "Micro", size: 10, weight: .medium, sample: "EQUITY • LARGE CAP")
            }

            // Typography Usage
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Usage Guidelines", subtitle: "When to use each style")

                VStack(spacing: 12) {
                    usageCard(
                        style: "Display",
                        when: "Hero numbers, portfolio totals",
                        example: "Use for the primary value users care about most"
                    )
                    usageCard(
                        style: "Title + Body",
                        when: "Card headers with descriptions",
                        example: "Pair bold titles with regular body for hierarchy"
                    )
                    usageCard(
                        style: "Caption + Micro",
                        when: "Metadata and labels",
                        example: "Timestamps, categories, secondary info"
                    )
                }
            }
        }
    }

    // MARK: - Components Section

    private var componentsSection: some View {
        VStack(alignment: .leading, spacing: 32) {
            // Buttons
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Buttons", subtitle: "Interactive elements")

                VStack(spacing: 12) {
                    // Primary Button
                    Button {} label: {
                        Text("Start Investing")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [SparrowDesign.Colors.primary, SparrowDesign.Colors.primaryDark],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(12)
                    }

                    HStack(spacing: 12) {
                        // Secondary Button
                        Button {} label: {
                            Text("Learn More")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(SparrowDesign.Colors.primary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(SparrowDesign.Colors.primary, lineWidth: 1.5)
                                )
                        }

                        // Ghost Button
                        Button {} label: {
                            HStack(spacing: 6) {
                                Image(systemName: "plus")
                                Text("Add Fund")
                            }
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(SparrowDesign.Colors.textSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(SparrowDesign.Colors.chipBackground)
                            )
                        }
                    }
                }
            }

            // Pills & Chips
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Pills & Chips", subtitle: "Filtering and categorization")

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        chipExample(text: "All", isSelected: true)
                        chipExample(text: "Equity", isSelected: false)
                        chipExample(text: "Debt", isSelected: false)
                        chipExample(text: "Hybrid", isSelected: false)
                        chipExample(text: "Gold", isSelected: false)
                    }
                }

                HStack(spacing: 8) {
                    statusPill(text: "+12.4%", color: SparrowDesign.Colors.success)
                    statusPill(text: "-2.3%", color: SparrowDesign.Colors.error)
                    statusPill(text: "NEW", color: SparrowDesign.Colors.info)
                    statusPill(text: "SIP", color: SparrowDesign.Colors.primary)
                }
            }

            // Cards
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Cards", subtitle: "Content containers")

                // Standard Card
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Axis Bluechip Fund")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(SparrowDesign.Colors.textPrimary)
                            Text("Large Cap • Equity")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(SparrowDesign.Colors.textSecondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("₹2,45,600")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(SparrowDesign.Colors.textPrimary)
                            Text("+18.4%")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(SparrowDesign.Colors.success)
                        }
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(SparrowDesign.Colors.cardBackground)
                        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
                )

                // Elevated Card with Accent
                HStack(spacing: 16) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(SparrowDesign.Colors.success.opacity(0.1))
                            .frame(width: 48, height: 48)
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(SparrowDesign.Colors.success)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Today's Gain")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(SparrowDesign.Colors.textSecondary)
                        Text("₹4,230")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundColor(SparrowDesign.Colors.success)
                    }

                    Spacer()
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(SparrowDesign.Colors.cardBackground)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(SparrowDesign.Colors.success.opacity(0.2), lineWidth: 1)
                        )
                )
            }

            // Input Fields
            VStack(alignment: .leading, spacing: 16) {
                sectionHeader(title: "Input Fields", subtitle: "User input components")

                VStack(spacing: 12) {
                    // Text Field
                    VStack(alignment: .leading, spacing: 6) {
                        Text("INVESTMENT AMOUNT")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(SparrowDesign.Colors.primary)
                            .tracking(0.5)

                        HStack {
                            Text("₹")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(SparrowDesign.Colors.textSecondary)
                            Text("25,000")
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundColor(SparrowDesign.Colors.textPrimary)
                            Spacer()
                        }
                        .padding(14)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(SparrowDesign.Colors.inputBackground)
                        )
                    }

                    // Slider
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("RISK TOLERANCE")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(SparrowDesign.Colors.primary)
                                .tracking(0.5)
                            Spacer()
                            Text("Moderate")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(SparrowDesign.Colors.textPrimary)
                        }

                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(SparrowDesign.Colors.progressBackground)
                                    .frame(height: 6)

                                RoundedRectangle(cornerRadius: 4)
                                    .fill(
                                        LinearGradient(
                                            colors: [SparrowDesign.Colors.primary, SparrowDesign.Colors.primaryDark],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geo.size.width * 0.5, height: 6)

                                Circle()
                                    .fill(.white)
                                    .shadow(color: Color.black.opacity(0.15), radius: 4, x: 0, y: 2)
                                    .frame(width: 20, height: 20)
                                    .offset(x: geo.size.width * 0.5 - 10)
                            }
                        }
                        .frame(height: 20)
                    }
                }
            }
        }
    }

    // MARK: - Charts Section

    private var chartsSection: some View {
        VStack(alignment: .leading, spacing: 32) {
            sectionHeader(title: "Chart Color System", subtitle: "Data visualization palette")

            // Chart Colors
            VStack(alignment: .leading, spacing: 16) {
                Text("ALLOCATION COLORS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                    .tracking(0.5)

                HStack(spacing: 0) {
                    chartColorBar(color: SparrowDesign.ChartColors.equity, label: "Equity", width: 0.45)
                    chartColorBar(color: SparrowDesign.ChartColors.debt, label: "Debt", width: 0.25)
                    chartColorBar(color: SparrowDesign.ChartColors.hybrid, label: "Hybrid", width: 0.15)
                    chartColorBar(color: SparrowDesign.ChartColors.gold, label: "Gold", width: 0.10)
                    chartColorBar(color: SparrowDesign.ChartColors.other, label: "Other", width: 0.05)
                }
                .frame(height: 40)
                .cornerRadius(8)
            }

            // Sample Donut Chart
            VStack(alignment: .leading, spacing: 16) {
                Text("DONUT CHART")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                    .tracking(0.5)

                HStack(spacing: 24) {
                    // Chart
                    ZStack {
                        Chart(SparrowDesign.ChartColors.sampleAllocation, id: \.name) { item in
                            SectorMark(
                                angle: .value("Value", item.value),
                                innerRadius: .ratio(0.65),
                                angularInset: 2
                            )
                            .foregroundStyle(item.color)
                        }
                        .frame(width: 140, height: 140)

                        VStack(spacing: 2) {
                            Text("₹24.5L")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(SparrowDesign.Colors.textPrimary)
                            Text("Total")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(SparrowDesign.Colors.textSecondary)
                        }
                    }

                    // Legend
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(SparrowDesign.ChartColors.sampleAllocation, id: \.name) { item in
                            HStack(spacing: 8) {
                                Circle()
                                    .fill(item.color)
                                    .frame(width: 10, height: 10)
                                Text(item.name)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(SparrowDesign.Colors.textPrimary)
                                Spacer()
                                Text("\(Int(item.value))%")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                            }
                        }
                    }
                }
                .padding(20)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(SparrowDesign.Colors.cardBackground)
                        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
                )
            }

            // Sample Line Chart
            VStack(alignment: .leading, spacing: 16) {
                Text("LINE CHART")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                    .tracking(0.5)

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Portfolio Growth")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(SparrowDesign.Colors.textPrimary)
                        Spacer()
                        Text("+24.8%")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(SparrowDesign.Colors.success)
                    }

                    Chart {
                        ForEach(SparrowDesign.sampleChartData, id: \.month) { data in
                            AreaMark(
                                x: .value("Month", data.month),
                                y: .value("Value", data.value)
                            )
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [
                                        SparrowDesign.Colors.primary.opacity(0.3),
                                        SparrowDesign.Colors.primary.opacity(0.05)
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )

                            LineMark(
                                x: .value("Month", data.month),
                                y: .value("Value", data.value)
                            )
                            .foregroundStyle(SparrowDesign.Colors.primary)
                            .lineStyle(StrokeStyle(lineWidth: 2.5))
                        }
                    }
                    .chartXAxis {
                        AxisMarks(values: .automatic) { value in
                            AxisValueLabel()
                                .font(.system(size: 10))
                                .foregroundStyle(SparrowDesign.Colors.textTertiary)
                        }
                    }
                    .chartYAxis {
                        AxisMarks(position: .leading) { value in
                            AxisValueLabel()
                                .font(.system(size: 10))
                                .foregroundStyle(SparrowDesign.Colors.textTertiary)
                        }
                    }
                    .frame(height: 160)
                }
                .padding(20)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(SparrowDesign.Colors.cardBackground)
                        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
                )
            }
        }
    }

    // MARK: - Tiles Section

    private var tilesSection: some View {
        VStack(alignment: .leading, spacing: 32) {
            sectionHeader(title: "Information Hierarchy", subtitle: "Visual weight system for data")

            // Hierarchy Explanation
            VStack(alignment: .leading, spacing: 12) {
                Text("TILE HIERARCHY")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                    .tracking(0.5)

                Text("Information tiles use visual weight to establish importance. Primary tiles demand attention, while tertiary tiles provide supporting context.")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                    .lineSpacing(4)
            }

            // Primary Tile (Hero)
            VStack(alignment: .leading, spacing: 8) {
                Text("PRIMARY • HERO LEVEL")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.primary)
                    .tracking(0.5)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Total Portfolio")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.8))

                    Text("₹24,56,780")
                        .font(.system(size: 34, weight: .bold))
                        .foregroundColor(.white)

                    HStack(spacing: 8) {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 12, weight: .bold))
                            Text("+₹4,230 (2.4%)")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Capsule().fill(.white.opacity(0.2)))

                        Text("Today")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(24)
                .background(
                    LinearGradient(
                        colors: [SparrowDesign.Colors.primary, SparrowDesign.Colors.primaryDark],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .cornerRadius(20)
            }

            // Secondary Tiles
            VStack(alignment: .leading, spacing: 8) {
                Text("SECONDARY • IMPORTANT METRICS")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.primary)
                    .tracking(0.5)

                HStack(spacing: 12) {
                    secondaryTile(
                        icon: "chart.line.uptrend.xyaxis",
                        label: "XIRR",
                        value: "18.4%",
                        color: SparrowDesign.Colors.success
                    )

                    secondaryTile(
                        icon: "arrow.triangle.2.circlepath",
                        label: "SIPs Active",
                        value: "5",
                        color: SparrowDesign.Colors.primary
                    )
                }
            }

            // Tertiary Tiles
            VStack(alignment: .leading, spacing: 8) {
                Text("TERTIARY • SUPPORTING INFO")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.primary)
                    .tracking(0.5)

                VStack(spacing: 8) {
                    tertiaryTile(label: "Invested Amount", value: "₹20,23,550")
                    tertiaryTile(label: "Current Value", value: "₹24,56,780")
                    tertiaryTile(label: "Total Returns", value: "₹4,33,230", valueColor: SparrowDesign.Colors.success)
                }
            }

            // Semantic Tiles
            VStack(alignment: .leading, spacing: 8) {
                Text("SEMANTIC • STATUS COMMUNICATION")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.primary)
                    .tracking(0.5)

                VStack(spacing: 12) {
                    semanticTile(
                        icon: "checkmark.circle.fill",
                        title: "On Track",
                        message: "Your retirement goal is progressing well",
                        type: .success
                    )

                    semanticTile(
                        icon: "exclamationmark.triangle.fill",
                        title: "Rebalancing Needed",
                        message: "Equity allocation is 8% above target",
                        type: .warning
                    )

                    semanticTile(
                        icon: "info.circle.fill",
                        title: "Tax Tip",
                        message: "Invest ₹75,000 more in ELSS to maximize 80C",
                        type: .info
                    )
                }
            }
        }
    }

    // MARK: - Helper Views

    private func sectionHeader(title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(SparrowDesign.Colors.textPrimary)
            Text(subtitle)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(SparrowDesign.Colors.textSecondary)
        }
    }

    private func principleCard(icon: String, title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(SparrowDesign.Colors.primary.opacity(0.1))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(SparrowDesign.Colors.primary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(SparrowDesign.Colors.textPrimary)
                Text(description)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                    .lineSpacing(3)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(SparrowDesign.Colors.cardBackground)
                .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 2)
        )
    }

    private func colorSwatch(color: Color, name: String, hex: String, isPrimary: Bool = false) -> some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(color)
                .frame(height: isPrimary ? 80 : 60)

            VStack(spacing: 2) {
                Text(name)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(SparrowDesign.Colors.textPrimary)
                Text(hex)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
            }
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity)
            .background(SparrowDesign.Colors.cardBackground)
        }
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(SparrowDesign.Colors.cardBorder, lineWidth: 1)
        )
    }

    private func neutralSwatch(color: Color, name: String) -> some View {
        VStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 40, height: 40)
            Text(name)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(SparrowDesign.Colors.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func gradientShowcase(gradient: LinearGradient, name: String, usage: String) -> some View {
        HStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 10)
                .fill(gradient)
                .frame(width: 60, height: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(SparrowDesign.Colors.textPrimary)
                Text(usage)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
            }
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(SparrowDesign.Colors.cardBackground)
        )
    }

    private func typeScaleRow(name: String, size: CGFloat, weight: Font.Weight, sample: String) -> some View {
        HStack(alignment: .center, spacing: 16) {
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.primary)
                Text("\(Int(size))pt")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundColor(SparrowDesign.Colors.textTertiary)
            }
            .frame(width: 60, alignment: .leading)

            Text(sample)
                .font(.system(size: size, weight: weight))
                .foregroundColor(SparrowDesign.Colors.textPrimary)
                .lineLimit(1)

            Spacer()
        }
        .padding(.vertical, 8)
    }

    private func usageCard(style: String, when: String, example: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(style)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.primary)
                Spacer()
                Text(when)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
            }
            Text(example)
                .font(.system(size: 13, weight: .regular))
                .foregroundColor(SparrowDesign.Colors.textSecondary)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SparrowDesign.Colors.chipBackground)
        )
    }

    private func chipExample(text: String, isSelected: Bool) -> some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(isSelected ? .white : SparrowDesign.Colors.textSecondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(isSelected ? SparrowDesign.Colors.primary : SparrowDesign.Colors.chipBackground)
            )
    }

    private func statusPill(text: String, color: Color) -> some View {
        Text(text)
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                Capsule()
                    .fill(color.opacity(0.12))
            )
    }

    private func chartColorBar(color: Color, label: String, width: CGFloat) -> some View {
        GeometryReader { geo in
            ZStack {
                Rectangle()
                    .fill(color)
                if width > 0.12 {
                    Text(label)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.white)
                }
            }
            .frame(width: geo.size.width * width)
        }
    }

    private func secondaryTile(icon: String, label: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(color.opacity(0.1))
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(color)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
                Text(value)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(SparrowDesign.Colors.textPrimary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(SparrowDesign.Colors.cardBackground)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(color.opacity(0.15), lineWidth: 1)
                )
        )
    }

    private func tertiaryTile(label: String, value: String, valueColor: Color = SparrowDesign.Colors.textPrimary) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(SparrowDesign.Colors.textSecondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(valueColor)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(SparrowDesign.Colors.chipBackground)
        )
    }

    private func semanticTile(icon: String, title: String, message: String, type: SemanticType) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 22))
                .foregroundColor(type.color)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(SparrowDesign.Colors.textPrimary)
                Text(message)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(SparrowDesign.Colors.textSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(SparrowDesign.Colors.textTertiary)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(type.color.opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(type.color.opacity(0.15), lineWidth: 1)
                )
        )
    }
}

// MARK: - Supporting Types

enum DesignSection: String, CaseIterable {
    case overview = "Overview"
    case colors = "Colors"
    case typography = "Typography"
    case components = "Components"
    case charts = "Charts"
    case tiles = "Tiles"
}

enum SemanticType {
    case success, warning, error, info

    var color: Color {
        switch self {
        case .success: return SparrowDesign.Colors.success
        case .warning: return SparrowDesign.Colors.warning
        case .error: return SparrowDesign.Colors.error
        case .info: return SparrowDesign.Colors.info
        }
    }
}

// MARK: - Sparrow Design System (Using AppTheme)

struct SparrowDesign {
    struct Colors {
        // Primary - Using AppTheme
        static var primary: Color { AppTheme.primary }
        static var primaryDark: Color { AppTheme.primaryDark }

        // Semantic - Using AppTheme
        static var success: Color { AppTheme.success }
        static var error: Color { AppTheme.error }
        static var warning: Color { AppTheme.warning }
        static var info: Color { AppTheme.secondary }

        // Text - Using AppTheme
        static var textPrimary: Color { AppTheme.textPrimary }
        static var textSecondary: Color { AppTheme.textSecondary }
        static var textTertiary: Color { AppTheme.textTertiary }

        // Backgrounds - Using AppTheme
        static var background: Color { AppTheme.background }
        static var cardBackground: Color { AppTheme.cardBackground }
        static var chipBackground: Color { AppTheme.chipBackground }
        static var inputBackground: Color { AppTheme.inputBackground }

        // Borders - Using AppTheme
        static var cardBorder: Color { AppTheme.cardBorder }
        static var progressBackground: Color { AppTheme.progressBackground }
    }

    struct ChartColors {
        static let equity = Color(hex: "#5B8DEF")
        static let debt = Color(hex: "#00D09C")
        static let hybrid = Color(hex: "#A78BFA")
        static let gold = Color(hex: "#FFB800")
        static let other = Color(hex: "#6B7280")

        static var sampleAllocation: [(name: String, value: Double, color: Color)] {
            [
                ("Equity", 45, equity),
                ("Debt", 25, debt),
                ("Hybrid", 15, hybrid),
                ("Gold", 10, gold),
                ("Other", 5, other)
            ]
        }
    }

    static let sampleChartData: [(month: String, value: Double)] = [
        ("Jan", 100),
        ("Feb", 108),
        ("Mar", 105),
        ("Apr", 115),
        ("May", 112),
        ("Jun", 124)
    ]
}

// MARK: - Preview

#Preview {
    NavigationStack {
        DesignSystemView()
    }
}
