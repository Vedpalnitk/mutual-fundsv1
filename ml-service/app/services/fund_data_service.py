"""
Fund data service that fetches real fund data from MFAPI.in
Provides cached fund data for recommendations and portfolio optimization.
"""

import httpx
import asyncio
import logging
from typing import List, Dict, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass

logger = logging.getLogger(__name__)

MFAPI_BASE_URL = "https://api.mfapi.in"

# Category to asset class mapping
CATEGORY_TO_ASSET_CLASS = {
    # Equity categories
    "Large Cap": "equity",
    "Mid Cap": "equity",
    "Small Cap": "equity",
    "Flexi Cap": "equity",
    "Large & Mid Cap": "equity",
    "Multi Cap": "equity",
    "Focused": "equity",
    "ELSS": "equity",
    "Sectoral": "equity",
    "Thematic": "equity",
    "Index": "equity",
    "Contra": "equity",
    "Value": "equity",
    "Dividend Yield": "equity",
    "Equity": "equity",
    "Equity Scheme - Value Fund": "equity",
    "Equity Scheme - Focused Fund": "equity",
    # Debt categories
    "Liquid": "liquid",
    "Overnight": "liquid",
    "Ultra Short Duration": "debt",
    "Low Duration": "debt",
    "Short Duration": "debt",
    "Medium Duration": "debt",
    "Medium to Long Duration": "debt",
    "Long Duration": "debt",
    "Dynamic Bond": "debt",
    "Debt Scheme - Dynamic Bond": "debt",
    "Corporate Bond": "debt",
    "Credit Risk": "debt",
    "Banking & PSU": "debt",
    "Gilt": "debt",
    "10 Yr Gilt": "debt",
    "Floater": "debt",
    "Income": "debt",
    "IDF": "debt",
    # Hybrid categories
    "Balanced Advantage": "hybrid",
    "Aggressive Hybrid": "hybrid",
    "Conservative Hybrid": "hybrid",
    "Dynamic Asset Allocation": "hybrid",
    "Multi Asset Allocation": "hybrid",
    "Multi Asset": "hybrid",
    "Equity Savings": "hybrid",
    "Arbitrage": "hybrid",
    # Alternative categories
    "Gold": "gold",
    "Gold ETF": "gold",
    "Silver": "gold",
    "FOF - International": "international",
    "International": "international",
    "Other": "equity",
}

# Keywords to identify fund categories from scheme names
CATEGORY_KEYWORDS = {
    "Large Cap": ["large cap", "largecap", "bluechip", "blue chip", "nifty 50", "sensex"],
    "Mid Cap": ["mid cap", "midcap", "mid-cap"],
    "Small Cap": ["small cap", "smallcap", "small-cap"],
    "Flexi Cap": ["flexi cap", "flexicap", "flexi-cap", "multi cap", "multicap"],
    "Value": ["value fund", "value equity", "contra"],
    "Focused": ["focused fund", "focused equity"],
    "ELSS": ["elss", "tax saver", "tax saving"],
    "Index": ["index fund", "nifty", "sensex", "etf"],
    "Sectoral": ["banking", "pharma", "it fund", "infrastructure", "consumption", "financial", "technology", "healthcare"],
    "Liquid": ["liquid", "overnight", "money market"],
    "Corporate Bond": ["corporate bond", "credit risk", "banking psu", "banking & psu"],
    "Dynamic Bond": ["dynamic bond"],
    "Gilt": ["gilt", "government securities", "gsec", "g-sec"],
    "Short Duration": ["short duration", "short term", "low duration", "ultra short"],
    "Medium Duration": ["medium duration", "medium term"],
    "Balanced Advantage": ["balanced advantage", "dynamic asset", "bal adv"],
    "Aggressive Hybrid": ["aggressive hybrid", "equity hybrid"],
    "Conservative Hybrid": ["conservative hybrid", "debt hybrid", "regular savings"],
    "Multi Asset": ["multi asset", "asset allocation"],
    "Arbitrage": ["arbitrage"],
    "Gold": ["gold"],
    "Silver": ["silver"],
    "International": ["nasdaq", "us bluechip", "international", "global", "emerging market", "china", "japan", "world", "greater china", "asia"],
}

# Popular AMCs to ensure diversity
POPULAR_AMCS = [
    "sbi", "hdfc", "icici", "axis", "kotak", "nippon", "aditya birla",
    "dsp", "mirae", "uti", "tata", "franklin", "invesco", "pgim",
    "canara robeco", "parag parikh", "quant", "motilal oswal", "edelweiss",
    "bandhan", "hsbc", "sundaram", "idfc", "l&t", "mahindra manulife"
]


@dataclass
class FundData:
    scheme_code: int
    scheme_name: str
    fund_house: str
    category: str
    nav: float
    return_1y: Optional[float] = None
    return_3y: Optional[float] = None
    return_5y: Optional[float] = None
    volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    expense_ratio: Optional[float] = None
    last_updated: Optional[datetime] = None


class FundDataService:
    """Service to fetch and cache real fund data from MFAPI.in"""

    def __init__(self, target_fund_count: int = 150):
        self._cache: Dict[int, FundData] = {}
        self._cache_expiry: Optional[datetime] = None
        self._cache_duration = timedelta(hours=6)  # Cache for 6 hours
        self._initialized = False
        self._all_schemes: List[dict] = []
        self._target_fund_count = target_fund_count

    async def initialize(self):
        """Initialize the fund data cache"""
        if not self._initialized:
            await self.refresh_all_funds()
            self._initialized = True

    async def get_fund(self, scheme_code: int) -> Optional[FundData]:
        """Get fund data by scheme code"""
        if scheme_code in self._cache:
            return self._cache[scheme_code]

        # Try to fetch if not in cache
        fund = await self._fetch_fund_data(scheme_code)
        if fund:
            self._cache[scheme_code] = fund
        return fund

    async def get_all_funds(self) -> List[FundData]:
        """Get all cached funds"""
        if not self._cache or self._is_cache_expired():
            await self.refresh_all_funds()
        return list(self._cache.values())

    def _is_cache_expired(self) -> bool:
        """Check if cache has expired"""
        if not self._cache_expiry:
            return True
        return datetime.now() > self._cache_expiry

    async def _fetch_all_schemes(self) -> List[dict]:
        """Fetch the master list of all schemes from MFAPI.in"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{MFAPI_BASE_URL}/mf")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching scheme list: {e}")
            return []

    def _select_diverse_funds(self, all_schemes: List[dict]) -> List[int]:
        """Select a diverse set of funds across categories and AMCs"""
        # Filter for Direct Growth plans only
        direct_growth = [
            s for s in all_schemes
            if "Direct" in s.get("schemeName", "") and "Growth" in s.get("schemeName", "")
        ]

        logger.info(f"Found {len(direct_growth)} Direct Growth schemes")

        # Categorize schemes
        categorized: Dict[str, List[dict]] = {cat: [] for cat in CATEGORY_KEYWORDS.keys()}
        categorized["Other"] = []

        for scheme in direct_growth:
            name_lower = scheme.get("schemeName", "").lower()
            categorized_flag = False

            for category, keywords in CATEGORY_KEYWORDS.items():
                if any(kw in name_lower for kw in keywords):
                    categorized[category].append(scheme)
                    categorized_flag = True
                    break

            if not categorized_flag:
                categorized["Other"].append(scheme)

        # Select funds ensuring diversity
        selected_codes: Set[int] = set()
        selected_amcs: Dict[str, int] = {}  # Track AMC selection count

        # Target distribution by category (minimum 5 per category)
        category_targets = {
            "Large Cap": 12,
            "Mid Cap": 10,
            "Small Cap": 10,
            "Flexi Cap": 10,
            "Value": 6,
            "Focused": 6,
            "ELSS": 8,
            "Index": 8,
            "Sectoral": 8,
            "Liquid": 6,
            "Corporate Bond": 6,
            "Dynamic Bond": 5,
            "Short Duration": 6,
            "Medium Duration": 5,
            "Gilt": 5,
            "Balanced Advantage": 8,
            "Aggressive Hybrid": 6,
            "Conservative Hybrid": 6,
            "Multi Asset": 5,
            "Arbitrage": 5,
            "Gold": 6,
            "Silver": 5,
            "International": 10,
            "Other": 5,
        }

        for category, target in category_targets.items():
            schemes = categorized.get(category, [])
            selected_count = 0

            # Sort schemes to prefer popular AMCs
            def amc_priority(scheme):
                name_lower = scheme.get("schemeName", "").lower()
                for i, amc in enumerate(POPULAR_AMCS):
                    if amc in name_lower:
                        return i
                return len(POPULAR_AMCS)

            schemes.sort(key=amc_priority)

            for scheme in schemes:
                if selected_count >= target:
                    break

                scheme_code = scheme.get("schemeCode")
                if not scheme_code or scheme_code in selected_codes:
                    continue

                # Check AMC diversity (max 8 funds per AMC)
                name_lower = scheme.get("schemeName", "").lower()
                amc = None
                for amc_name in POPULAR_AMCS:
                    if amc_name in name_lower:
                        amc = amc_name
                        break

                if amc:
                    if selected_amcs.get(amc, 0) >= 8:
                        continue
                    selected_amcs[amc] = selected_amcs.get(amc, 0) + 1

                selected_codes.add(scheme_code)
                selected_count += 1

        logger.info(f"Selected {len(selected_codes)} diverse funds across categories")
        return list(selected_codes)

    async def refresh_all_funds(self):
        """Refresh all fund data from MFAPI.in"""
        logger.info("Refreshing fund data from MFAPI.in...")

        # Step 1: Fetch master list of all schemes
        all_schemes = await self._fetch_all_schemes()
        if not all_schemes:
            logger.error("Failed to fetch scheme list, using existing cache")
            return

        self._all_schemes = all_schemes
        logger.info(f"Total schemes available: {len(all_schemes)}")

        # Step 2: Select diverse funds
        selected_codes = self._select_diverse_funds(all_schemes)

        # Step 3: Fetch details for selected funds (in batches to avoid rate limiting)
        batch_size = 20
        all_results = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            for i in range(0, len(selected_codes), batch_size):
                batch = selected_codes[i:i + batch_size]
                tasks = [self._fetch_fund_data_with_client(client, code) for code in batch]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                all_results.extend(results)

                # Small delay between batches to be nice to the API
                if i + batch_size < len(selected_codes):
                    await asyncio.sleep(0.5)

        success_count = 0
        for result in all_results:
            if isinstance(result, FundData):
                self._cache[result.scheme_code] = result
                success_count += 1
            elif isinstance(result, Exception):
                logger.warning(f"Failed to fetch fund: {result}")

        self._cache_expiry = datetime.now() + self._cache_duration
        logger.info(f"Fund data refresh complete. Loaded {success_count}/{len(selected_codes)} funds.")

    async def _fetch_fund_data(self, scheme_code: int) -> Optional[FundData]:
        """Fetch single fund data"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            return await self._fetch_fund_data_with_client(client, scheme_code)

    async def _fetch_fund_data_with_client(self, client: httpx.AsyncClient, scheme_code: int) -> Optional[FundData]:
        """Fetch fund data using provided client"""
        try:
            response = await client.get(f"{MFAPI_BASE_URL}/mf/{scheme_code}")
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "SUCCESS":
                meta = data.get("meta", {})
                nav_data = data.get("data", [])

                # Calculate returns from NAV data
                current_nav = float(nav_data[0]["nav"]) if nav_data else 0
                return_1y = self._calculate_return(nav_data, 365)
                return_3y = self._calculate_return(nav_data, 365 * 3)
                return_5y = self._calculate_return(nav_data, 365 * 5)

                # Estimate volatility from NAV variance (simplified)
                volatility = self._calculate_volatility(nav_data)

                # Estimate sharpe ratio (simplified - using 6% risk-free rate)
                sharpe = self._calculate_sharpe(return_1y, volatility, risk_free_rate=6.0)

                # Infer category and expense ratio
                scheme_name = meta.get("scheme_name", "")
                category = self._infer_category(scheme_name, meta.get("scheme_category", ""))
                expense_ratio = self._estimate_expense_ratio(category)

                return FundData(
                    scheme_code=scheme_code,
                    scheme_name=scheme_name,
                    fund_house=meta.get("fund_house", "Unknown"),
                    category=category,
                    nav=current_nav,
                    return_1y=return_1y,
                    return_3y=return_3y,
                    return_5y=return_5y,
                    volatility=volatility,
                    sharpe_ratio=sharpe,
                    expense_ratio=expense_ratio,
                    last_updated=datetime.now()
                )
        except Exception as e:
            logger.error(f"Error fetching fund {scheme_code}: {e}")
            return None

    def _calculate_return(self, nav_data: List[dict], days: int) -> Optional[float]:
        """Calculate CAGR return over specified days"""
        if len(nav_data) < 2:
            return None

        current_nav = float(nav_data[0]["nav"])

        # Find NAV from 'days' ago
        target_date = datetime.now() - timedelta(days=days)
        old_nav = None

        for entry in nav_data:
            try:
                entry_date = datetime.strptime(entry["date"], "%d-%m-%Y")
                if entry_date <= target_date:
                    old_nav = float(entry["nav"])
                    break
            except (ValueError, KeyError):
                continue

        if old_nav and old_nav > 0:
            years = days / 365.0
            cagr = ((current_nav / old_nav) ** (1 / years) - 1) * 100
            return round(cagr, 2)

        return None

    def _calculate_volatility(self, nav_data: List[dict], days: int = 252) -> Optional[float]:
        """Calculate annualized volatility from daily returns"""
        if len(nav_data) < min(days, 30):
            return None

        # Get NAVs for the period
        navs = []
        for entry in nav_data[:days]:
            try:
                navs.append(float(entry["nav"]))
            except (ValueError, KeyError):
                continue

        if len(navs) < 20:
            return None

        # Calculate daily returns
        returns = []
        for i in range(1, len(navs)):
            if navs[i-1] > 0:
                daily_return = (navs[i-1] - navs[i]) / navs[i] * 100  # navs are newest first
                returns.append(daily_return)

        if not returns:
            return None

        # Calculate standard deviation and annualize
        import statistics
        try:
            daily_std = statistics.stdev(returns)
            annualized_vol = daily_std * (252 ** 0.5)
            return round(annualized_vol, 2)
        except statistics.StatisticsError:
            return None

    def _calculate_sharpe(self, annual_return: Optional[float], volatility: Optional[float],
                          risk_free_rate: float = 6.0) -> Optional[float]:
        """Calculate Sharpe ratio"""
        if annual_return is None or volatility is None or volatility == 0:
            return None

        sharpe = (annual_return - risk_free_rate) / volatility
        return round(sharpe, 2)

    def _infer_category(self, scheme_name: str, scheme_category: str) -> str:
        """Infer fund category from name and metadata"""
        name_lower = scheme_name.lower()

        # Check keywords in order of specificity
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in name_lower for kw in keywords):
                return category

        # Fallback to scheme_category if available
        if scheme_category:
            return scheme_category

        return "Other"

    def _estimate_expense_ratio(self, category: str) -> float:
        """Estimate expense ratio based on category (Direct plans)"""
        expense_map = {
            "Liquid": 0.20,
            "Overnight": 0.15,
            "Corporate Bond": 0.30,
            "Short Duration": 0.30,
            "Gilt": 0.35,
            "Gold": 0.35,
            "Large Cap": 0.70,
            "Index": 0.20,
            "Flexi Cap": 0.65,
            "Mid Cap": 0.75,
            "Small Cap": 0.85,
            "ELSS": 0.75,
            "Sectoral": 0.80,
            "Balanced Advantage": 0.80,
            "Aggressive Hybrid": 0.80,
            "Conservative Hybrid": 0.70,
            "International": 0.50,
        }
        return expense_map.get(category, 0.70)


# Singleton instance
fund_data_service = FundDataService(target_fund_count=150)


def get_funds_as_dict_list() -> List[Dict]:
    """Get all funds as list of dicts (for compatibility with existing code)"""
    import asyncio

    # Get event loop or create one
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    # If we're already in an async context, we can't use run_until_complete
    # So we return cached data or empty list
    if fund_data_service._cache:
        funds = list(fund_data_service._cache.values())
    else:
        # Run initialization synchronously for first call
        try:
            loop.run_until_complete(fund_data_service.refresh_all_funds())
            funds = list(fund_data_service._cache.values())
        except RuntimeError:
            # Already in async context, return empty and let async code handle it
            logger.warning("Cannot fetch funds synchronously from async context. Using fallback.")
            return get_fallback_funds()

    return [
        {
            "scheme_code": f.scheme_code,
            "scheme_name": f.scheme_name,
            "fund_house": f.fund_house,
            "category": f.category,
            "asset_class": CATEGORY_TO_ASSET_CLASS.get(f.category, "equity"),
            "return_1y": f.return_1y or 0,
            "return_3y": f.return_3y or 0,
            "return_5y": f.return_5y or 0,
            "volatility": f.volatility or 15.0,
            "sharpe_ratio": f.sharpe_ratio or 0.8,
            "expense_ratio": f.expense_ratio or 0.5,
        }
        for f in funds
    ]


def get_fallback_funds() -> List[Dict]:
    """Fallback fund data in case API is unavailable"""
    return [
        {
            "scheme_code": 119598,
            "scheme_name": "Parag Parikh Flexi Cap Fund Direct Growth",
            "fund_house": "PPFAS Mutual Fund",
            "category": "Flexi Cap",
            "return_1y": 22.4,
            "return_3y": 18.7,
            "return_5y": 19.2,
            "volatility": 14.2,
            "sharpe_ratio": 1.1,
            "expense_ratio": 0.63,
        },
        {
            "scheme_code": 120503,
            "scheme_name": "Quant Flexi Cap Fund Direct Growth",
            "fund_house": "Quant Mutual Fund",
            "category": "Flexi Cap",
            "return_1y": 28.5,
            "return_3y": 24.3,
            "return_5y": 22.1,
            "volatility": 18.5,
            "sharpe_ratio": 1.2,
            "expense_ratio": 0.58,
        },
    ]
