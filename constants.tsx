import React from 'react';
import { InvestorStrategy, ComplexInvestorStrategy, HyperComplexInvestorStrategy } from './types';
import { NeuralNetwork } from './services/neuralNetwork';

// Fix: Add a specific type for corporate event configurations to improve type safety.
interface CorporateEventConfig {
  name: string;
  description: string;
  impact?: number; // Made optional for neutral events
  type: 'positive' | 'negative' | 'neutral' | 'political' | 'disaster';
}

type InvestorConfig = {
  id: string;
  name: string;
  isHuman?: boolean;
  strategyName?: string;
  strategy: InvestorStrategy | ComplexInvestorStrategy | HyperComplexInvestorStrategy;
};


export const STOCK_SYMBOLS = [
  { symbol: 'INNV', name: 'Innovate Corp', sector: 'Technology' },
  { symbol: 'TECH', name: 'TechGen Inc.', sector: 'Technology' },
  { symbol: 'HLTH', name: 'HealthSphere', sector: 'Health' },
  { symbol: 'ENRG', name: 'Syner-G', sector: 'Energy' },
  { symbol: 'FINX', name: 'FinEx Solutions', sector: 'Finance' },
  { symbol: 'QUAN', name: 'Quantum Leap', sector: 'Technology' },
  { symbol: 'CYBR', name: 'CyberSec Corp', sector: 'Technology' },
  { symbol: 'BIOF', 'name': 'BioFuture Labs', sector: 'Health' },
  { symbol: 'SOLR', name: 'Solaris Energy', sector: 'Energy' },
  { symbol: 'DRON', name: 'DroneWorks', sector: 'Technology' },
  { symbol: 'DATA', name: 'DataMine Inc.', sector: 'Technology' },
  { symbol: 'ROBO', name: 'RoboGenix', sector: 'Technology' },
  { symbol: 'AQUA', name: 'AquaPure', sector: 'Industrials' },
  { symbol: 'FUTR', name: 'Futuristics', sector: 'Industrials' },
  { symbol: 'SPCE', name: 'SpaceWarp', sector: 'Industrials' },
  { symbol: 'NANO', name: 'NanoBuild', sector: 'Technology' },
  { symbol: 'VRTX', name: 'Vertex Realty', sector: 'Finance' },
  { symbol: 'GAME', name: 'GameSphere', sector: 'Technology' },
  { symbol: 'MEDI', name: 'MediCare+', sector: 'Health' },
  { symbol: 'AGRI', name: 'AgriGrow', sector: 'Industrials' },
  // Technology Additions
  { symbol: 'EDGE', name: 'Edge AI Systems', sector: 'Technology' },
  { symbol: 'CLD', name: 'CloudCore Inc.', sector: 'Technology' },
  { symbol: 'VR', name: 'Virtual Reality Labs', sector: 'Technology' },
  { symbol: 'IOT', name: 'Internet of Things Co.', sector: 'Technology' },
  { symbol: 'SFTW', name: 'Software Solutions', sector: 'Technology' },
  { symbol: 'LOGI', name: 'LogiCore', sector: 'Technology' },
  // Health Additions
  { symbol: 'GENE', name: 'Genomics PLC', sector: 'Health' },
  { symbol: 'TELE', name: 'TeleHealth Connect', sector: 'Health' },
  { symbol: 'SURG', name: 'Surgical Systems', sector: 'Health' },
  { symbol: 'VITA', name: 'VitaPharm', sector: 'Health' },
  { symbol: 'CARE', name: 'CareBotics', sector: 'Health' },
  { symbol: 'IMMU', name: 'ImmunoTherapeutics', sector: 'Health' },
  // Energy Additions
  { symbol: 'HYDR', name: 'HydroGen Power', sector: 'Energy' },
  { symbol: 'WIND', name: 'Windmill Corp', sector: 'Energy' },
  { symbol: 'NUCL', name: 'Nuclear Fusion Inc.', sector: 'Energy' },
  { symbol: 'BATT', name: 'BatteryTech', sector: 'Energy' },
  { symbol: 'GEO', name: 'GeoThermal Dynamics', sector: 'Energy' },
  { symbol: 'GRID', name: 'SmartGrid Systems', sector: 'Energy' },
  // Finance Additions
  { symbol: 'INSR', name: 'InsuranTech', sector: 'Finance' },
  { symbol: 'PAY', name: 'PaySphere', sector: 'Finance' },
  { symbol: 'LEND', name: 'LendLogic', sector: 'Finance' },
  { symbol: 'BLOK', name: 'BlockChain Ventures', sector: 'Finance' },
  { symbol: 'TRDE', name: 'TradeFlow', sector: 'Finance' },
  { symbol: 'WEAL', name: 'WealthWise', sector: 'Finance' },
  // Industrials Additions
  { symbol: 'AERO', name: 'AeroDynamics', sector: 'Industrials' },
  { symbol: 'SHIP', name: 'Global Shipping', sector: 'Industrials' },
  { symbol: 'BLD', name: 'BuildRight Construction', sector: 'Industrials' },
  { symbol: 'AUTO', name: 'AutoDrive Systems', sector: 'Industrials' },
  { symbol: 'CHEM', name: 'ChemiCorp', sector: 'Industrials' },
  { symbol: 'RAIL', name: 'RailWorks Logistics', sector: 'Industrials' },
  // --- Additional Stocks (272) ---
  // --- Technology Sector (55 new) ---
  { symbol: 'QNTM', name: 'Quantum Core AI', sector: 'Technology' },
  { symbol: 'SGLR', name: 'Singularity Solutions', sector: 'Technology' },
  { symbol: 'FBRC', name: 'Fabricate Robotics', sector: 'Technology' },
  { symbol: 'CRWN', name: 'CrowdNet Systems', sector: 'Technology' },
  { symbol: 'PLGN', name: 'Polygon Graphics', sector: 'Technology' },
  { symbol: 'NVGT', name: 'Navigate Mapping', sector: 'Technology' },
  { symbol: 'ZPHY', name: 'Zephyr OS', sector: 'Technology' },
  { symbol: 'ECHO', name: 'EchoComms Inc.', sector: 'Technology' },
  { symbol: 'VLCT', name: 'Velocity Data', sector: 'Technology' },
  { symbol: 'AXON', name: 'Axon Neural', sector: 'Technology' },
  { symbol: 'PXL', name: 'PixelForge', sector: 'Technology' },
  { symbol: 'CDX', name: 'Codex Software', sector: 'Technology' },
  { symbol: 'SYN', name: 'SynthoLogic', sector: 'Technology' },
  { symbol: 'VRTU', name: 'VirtuVerse', sector: 'Technology' },
  { symbol: 'ADPT', name: 'AdaptiCore', sector: 'Technology' },
  { symbol: 'EVLV', name: 'Evolv AI', sector: 'Technology' },
  { symbol: 'NBLA', name: 'Nebula Cloud', sector: 'Technology' },
  { symbol: 'FRGM', name: 'Fragment Security', sector: 'Technology' },
  { symbol: 'CRTX', name: 'Cortex Circuits', sector: 'Technology' },
  { symbol: 'LNKD', name: 'Link-State Comms', sector: 'Technology' },
  { symbol: 'OMNI', name: 'Omni-Metrics', sector: 'Technology' },
  { symbol: 'VCTR', name: 'Vector AI', sector: 'Technology' },
  { symbol: 'APEX', name: 'Apex Logic', sector: 'Technology' },
  { symbol: 'ZNTH', name: 'Zenith Ware', sector: 'Technology' },
  { symbol: 'FUSN', name: 'Fusion Data', sector: 'Technology' },
  { symbol: 'NRAL', name: 'Neural-Net Labs', sector: 'Technology' },
  { symbol: 'DGTZ', name: 'Digitize Solutions', sector: 'Technology' },
  { symbol: 'ALGO', name: 'Algo-Rhythm', sector: 'Technology' },
  { symbol: 'STRM', name: 'StreamCore', sector: 'Technology' },
  { symbol: 'ARCA', name: 'Arcane Software', sector: 'Technology' },
  { symbol: 'CRCL', name: 'Circuitry Inc.', sector: 'Technology' },
  { symbol: 'TTRN', name: 'Patternica', sector: 'Technology' },
  { symbol: 'MDLR', name: 'Modular Systems', sector: 'Technology' },
  { symbol: 'PRSM', name: 'Prism Analytics', sector: 'Technology' },
  { symbol: 'SPR', name: 'Sphere Virtual', sector: 'Technology' },
  { symbol: 'INTG', name: 'Integrix', sector: 'Technology' },
  { symbol: 'FLNT', name: 'Fluent AI', sector: 'Technology' },
  { symbol: 'LYNX', name: 'Lynx Microsystems', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Core', sector: 'Technology' },
  { symbol: 'PHSE', name: 'Phase Shift', sector: 'Technology' },
  { symbol: 'RDTN', name: 'Radiant Tech', sector: 'Technology' },
  { symbol: 'SCPT', name: 'ScriptLogic', sector: 'Technology' },
  { symbol: 'TNSN', name: 'Tension Networks', sector: 'Technology' },
  { symbol: 'UNTY', name: 'Unity Base', sector: 'Technology' },
  { symbol: 'WFRM', name: 'Waveform Digital', sector: 'Technology' },
  { symbol: 'XNPS', name: 'Synapse Dynamics', sector: 'Technology' },
  { symbol: 'YGG', name: 'Yggdrasil Computing', sector: 'Technology' },
  { symbol: 'ZTRX', name: 'Zetrix Solutions', sector: 'Technology' },
  { symbol: 'TSRT', name: 'Tesseract Systems', sector: 'Technology' },
  { symbol: 'ATLS', name: 'Atlas AI', sector: 'Technology' },
  { symbol: 'HIVE', name: 'HiveMind Connect', sector: 'Technology' },
  { symbol: 'MTRX', name: 'Matrix Labs', sector: 'Technology' },
  { symbol: 'PRLL', name: 'Parallel Process', sector: 'Technology' },
  { symbol: 'CBLT', name: 'Cobalt Robotics', sector: 'Technology' },
  { symbol: 'META', name: 'Meta-Verse Dynamics', sector: 'Technology' },
  // --- Health Sector (54 new) ---
  { symbol: 'VTPH', name: 'Vertex Pharma', sector: 'Health' },
  { symbol: 'CRDL', name: 'CardioLogic', sector: 'Health' },
  { symbol: 'ONCX', name: 'Onco-X Therapeutics', sector: 'Health' },
  { symbol: 'SANO', name: 'SanoVita Labs', sector: 'Health' },
  { symbol: 'CURE', name: 'CureAll Pharma', sector: 'Health' },
  { symbol: 'HEAL', name: 'HealPoint Diagnostics', sector: 'Health' },
  { symbol: 'PLSE', name: 'Pulse-Wave Medical', sector: 'Health' },
  { symbol: 'VTAL', name: 'Vitalis Health', sector: 'Health' },
  { symbol: 'CLNX', name: 'Clini-Gen', sector: 'Health' },
  { symbol: 'RJUV', name: 'Rejuva Life Sciences', sector: 'Health' },
  { symbol: 'ORTH', name: 'Ortho-Solutions', sector: 'Health' },
  { symbol: 'PDIA', name: 'Pedia-Care Inc.', sector: 'Health' },
  { symbol: 'DNTL', name: 'Denta-Tech', sector: 'Health' },
  { symbol: 'OPTI', name: 'Opti-View Systems', sector: 'Health' },
  { symbol: 'PRCS', name: 'Precision Surgical', sector: 'Health' },
  { symbol: 'GNCS', name: 'Genecis Corp', sector: 'Health' },
  { symbol: 'TRNS', name: 'Trans-Medica', sector: 'Health' },
  { symbol: 'NBLS', name: 'Nebulis Inhalants', sector: 'Health' },
  { symbol: 'SNTC', name: 'Senti-Tech', sector: 'Health' },
  { symbol: 'BHWL', name: 'Bio-Wellness', sector: 'Health' },
  { symbol: 'CTSL', name: 'Catalyst Bio', sector: 'Health' },
  { symbol: 'DRMA', name: 'Derma-Cure', sector: 'Health' },
  { symbol: 'ELXR', name: 'Elixir Life', sector: 'Health' },
  { symbol: 'FLRA', name: 'Flora-Health', sector: 'Health' },
  { symbol: 'HYGA', name: 'Hygeia Labs', sector: 'Health' },
  { symbol: 'INFN', name: 'Infin-Gene', sector: 'Health' },
  { symbol: 'LMNL', name: 'Lumenal Devices', sector: 'Health' },
  { symbol: 'MCRB', name: 'Micro-Bionics', sector: 'Health' },
  { symbol: 'NUTR', name: 'Nutri-Gen', sector: 'Health' },
  { symbol: 'PRTG', name: 'Proteus Medical', sector: 'Health' },
  { symbol: 'SNTL', name: 'Sentinel Health', sector: 'Health' },
  { symbol: 'TRMA', name: 'Trauma-Care', sector: 'Health' },
  { symbol: 'UNVR', name: 'Univer-Salts', sector: 'Health' },
  { symbol: 'VCTS', name: 'Vectis Diagnostics', sector: 'Health' },
  { symbol: 'XNTC', name: 'Xenotic Pharma', sector: 'Health' },
  { symbol: 'ZMRN', name: 'Zym-Renew', sector: 'Health' },
  { symbol: 'AURA', name: 'Aura-Sense', sector: 'Health' },
  { symbol: 'CRBR', name: 'Cerebral Dynamics', sector: 'Health' },
  { symbol: 'DNVA', name: 'Dena-Vita Inc.', sector: 'Health' },
  { symbol: 'IMPL', name: 'Implanta-Tech', sector: 'Health' },
  { symbol: 'LNVA', name: 'Longev-A', sector: 'Health' },
  { symbol: 'MYCO', name: 'Myco-Pharma', sector: 'Health' },
  { symbol: 'NBLT', name: 'Nebulite', sector: 'Health' },
  { symbol: 'PULM', name: 'Pulmo-Care', sector: 'Health' },
  { symbol: 'RNWL', name: 'Renewal Med', sector: 'Health' },
  { symbol: 'Soma', name: 'Soma-Tech', sector: 'Health' },
  { symbol: 'TRQN', name: 'Tranquil-Life', sector: 'Health' },
  { symbol: 'VIVI', name: 'Vivid-Health', sector: 'Health' },
  { symbol: 'XTND', name: 'Extend-Life', sector: 'Health' },
  { symbol: 'ALGY', name: 'Alga-Health', sector: 'Health' },
  { symbol: 'KINE', name: 'Kineti-Care', sector: 'Health' },
  { symbol: 'NRVE', name: 'Nerve-Gen', sector: 'Health' },
  { symbol: 'STSK', name: 'Status-K', sector: 'Health' },
  { symbol: 'ZYGN', name: 'Zygon Health', sector: 'Health' },
  // --- Energy Sector (54 new) ---
  { symbol: 'FLUX', name: 'Flux Power Grid', sector: 'Energy' },
  { symbol: 'ATMO', name: 'Atmo-Sphere Energy', sector: 'Energy' },
  { symbol: 'TRRA', name: 'Terra-Volt', sector: 'Energy' },
  { symbol: 'CRYO', name: 'Cryo-Gen', sector: 'Energy' },
  { symbol: 'PYRO', name: 'Pyro-Source', sector: 'Energy' },
  { symbol: 'KNTC', name: 'Kinetic Power', sector: 'Energy' },
  { symbol: 'STTC', name: 'Static Electric', sector: 'Energy' },
  { symbol: 'WVFR', name: 'Waveform Energy', sector: 'Energy' },
  { symbol: 'TDAL', name: 'Tidal-Flow', sector: 'Energy' },
  { symbol: 'SPRK', name: 'Spark Resources', sector: 'Energy' },
  { symbol: 'PTRL', name: 'Petro-Global', sector: 'Energy' },
  { symbol: 'BFL', name: 'Bio-Fuel Corp', sector: 'Energy' },
  { symbol: 'CRBN', name: 'Carbon Capture Co.', sector: 'Energy' },
  { symbol: 'DRLL', name: 'Drill-Tech', sector: 'Energy' },
  { symbol: 'ELCT', name: 'Electri-Core', sector: 'Energy' },
  { symbol: 'FSL', name: 'Fossil Fuels Inc.', sector: 'Energy' },
  { symbol: 'GTHR', name: 'Geothermal Co.', sector: 'Energy' },
  { symbol: 'HBR', name: 'Harbor Energy', sector: 'Energy' },
  { symbol: 'ION', name: 'Ion-Drive', sector: 'Energy' },
  { symbol: 'JLT', name: 'Jolt Power', sector: 'Energy' },
  { symbol: 'LMN', name: 'Lumen-Watt', sector: 'Energy' },
  { symbol: 'MTRN', name: 'Metron Gas', sector: 'Energy' },
  { symbol: 'NRTH', name: 'North Sea Oil', sector: 'Energy' },
  { symbol: 'OCEN', name: 'Oceanic Power', sector: 'Energy' },
  { symbol: 'PPLN', name: 'PipeLine Inc.', sector: 'Energy' },
  { symbol: 'QSR', name: 'Quasar Energy', sector: 'Energy' },
  { symbol: 'RFN', name: 'Refine-Co', sector: 'Energy' },
  { symbol: 'SHLE', name: 'Shale Dynamics', sector: 'Energy' },
  { symbol: 'TRBN', name: 'Turbine Dynamics', sector: 'Energy' },
  { symbol: 'VLTA', name: 'Voltaic Systems', sector: 'Energy' },
  { symbol: 'XTRC', name: 'Extract Energy', sector: 'Energy' },
  { symbol: 'YTNE', name: 'Yotta-NRG', sector: 'Energy' },
  { symbol: 'ZENE', name: 'Zenith Energy', sector: 'Energy' },
  { symbol: 'AMPV', name: 'AmpereVolt', sector: 'Energy' },
  { symbol: 'CONV', name: 'Converge Power', sector: 'Energy' },
  { symbol: 'DYNO', name: 'Dyno-Source', sector: 'Energy' },
  { symbol: 'ETHN', name: 'Ethanol Plus', sector: 'Energy' },
  { symbol: 'FRAC', name: 'Fracture Oil Co.', sector: 'Energy' },
  { symbol: 'GIGA', name: 'GigaWatt Storage', sector: 'Energy' },
  { symbol: 'HELI', name: 'Helios Power', sector: 'Energy' },
  { symbol: 'INFR', name: 'Infra-Grid Energy', sector: 'Energy' },
  { symbol: 'KILO', name: 'Kilo-Source', sector: 'Energy' },
  { symbol: 'LITH', name: 'Lithium Core', sector: 'Energy' },
  { symbol: 'MEGA', name: 'Mega-Charge', sector: 'Energy' },
  { symbol: 'NEON', name: 'Neon Gas Co.', sector: 'Energy' },
  { symbol: 'OPTM', name: 'Optima Fuel', sector: 'Energy' },
  { symbol: 'PLSM', name: 'Plasma-Drive', sector: 'Energy' },
  { symbol: 'RDT', name: 'Radiant Heat', sector: 'Energy' },
  { symbol: 'SONC', name: 'Sonic Energy', sector: 'Energy' },
  { symbol: 'THRM', name: 'Therma-Gen', sector: 'Energy' },
  { symbol: 'URAN', name: 'Uranium One', sector: 'Energy' },
  { symbol: 'VRTX', name: 'Vortex Wind', sector: 'Energy' },
  { symbol: 'WATT', name: 'Watt-Solutions', sector: 'Energy' },
  { symbol: 'FUSN', name: 'Fusion Power Co', sector: 'Energy' },
  // --- Finance Sector (54 new) ---
  { symbol: 'ACML', name: 'Accumulus Capital', sector: 'Finance' },
  { symbol: 'BNKR', name: 'BankRight', sector: 'Finance' },
  { symbol: 'CRDO', name: 'Credo Finance', sector: 'Finance' },
  { symbol: 'DIVI', name: 'Dividend Trust', sector: 'Finance' },
  { symbol: 'EQUI', name: 'Equi-Trade', sector: 'Finance' },
  { symbol: 'FLNT', name: 'Fluent Payments', sector: 'Finance' },
  { symbol: 'GLBE', name: 'GlobalVest', sector: 'Finance' },
  { symbol: 'HRBR', name: 'Harbor Holdings', sector: 'Finance' },
  { symbol: 'IVST', name: 'Investa-Corp', sector: 'Finance' },
  { symbol: 'JBLT', name: 'Jubilee Trust', sector: 'Finance' },
  { symbol: 'KNSH', name: 'Kensho Capital', sector: 'Finance' },
  { symbol: 'LGCY', name: 'Legacy Bank', sector: 'Finance' },
  { symbol: 'MRKT', name: 'Market-Flow', sector: 'Finance' },
  { symbol: 'NEXS', name: 'Nexus Capital', sector: 'Finance' },
  { symbol: 'OPLN', name: 'Opulence Wealth', sector: 'Finance' },
  { symbol: 'PRSP', name: 'Prosper-Fund', sector: 'Finance' },
  { symbol: 'QNTF', name: 'Quant-Fi', sector: 'Finance' },
  { symbol: 'RELY', name: 'Rely-Sure', sector: 'Finance' },
  { symbol: 'STRL', name: 'Sterling Group', sector: 'Finance' },
  { symbol: 'TRST', name: 'Trust-Core', sector: 'Finance' },
  { symbol: 'UNFY', name: 'Unify Financial', sector: 'Finance' },
  { symbol: 'VLUE', name: 'Value-Base', sector: 'Finance' },
  { symbol: 'WRTH', name: 'Worth-Well', sector: 'Finance' },
  { symbol: 'XCHG', name: 'X-Change', sector: 'Finance' },
  { symbol: 'YLD', name: 'Yield-Stone', sector: 'Finance' },
  { symbol: 'ZENT', name: 'Zenith Trust', sector: 'Finance' },
  { symbol: 'AST', name: 'Asset-Wise', sector: 'Finance' },
  { symbol: 'BETA', name: 'Beta-Vest', sector: 'Finance' },
  { symbol: 'CMPT', name: 'Compound Capital', sector: 'Finance' },
  { symbol: 'DLR', name: 'Dollar-Wise', sector: 'Finance' },
  { symbol: 'FLIO', name: 'Folio-Metrics', sector: 'Finance' },
  { symbol: 'GRNT', name: 'Guaranty Trust', sector: 'Finance' },
  { symbol: 'HEDG', name: 'Hedge-Right', sector: 'Finance' },
  { symbol: 'INCM', name: 'Income-Plus', sector: 'Finance' },
  { symbol: 'LVRG', name: 'Leverage Co.', sector: 'Finance' },
  { symbol: 'MNTY', name: 'Moneta Systems', sector: 'Finance' },
  { symbol: 'NVGT', name: 'Navigate Funds', sector: 'Finance' },
  { symbol: 'PLCY', name: 'Policy-Sure', sector: 'Finance' },
  { symbol: 'RTRN', name: 'Return-First', sector: 'Finance' },
  { symbol: 'SAVY', name: 'Savvy-Invest', sector: 'Finance' },
  { symbol: 'TNGS', name: 'Tangible Assets', sector: 'Finance' },
  { symbol: 'UTLY', name: 'Utility Finance', sector: 'Finance' },
  { symbol: 'VSTA', name: 'Vista Holdings', sector: 'Finance' },
  { symbol: 'WLTH', name: 'Wealth-Core', sector: 'Finance' },
  { symbol: 'XFIN', name: 'X-Finance', sector: 'Finance' },
  { symbol: 'YFIN', name: 'Y-Finance', sector: 'Finance' },
  { symbol: 'ZFIN', name: 'Z-Finance', sector: 'Finance' },
  { symbol: 'ALPH', name: 'Alpha-Vest', sector: 'Finance' },
  { symbol: 'CAP', name: 'Capital-Source', sector: 'Finance' },
  { symbol: 'EQTY', name: 'Equity-First', sector: 'Finance' },
  { symbol: 'FND', name: 'Foundation Trust', sector: 'Finance' },
  { symbol: 'GROW', name: 'Growth-Fund', sector: 'Finance' },
  { symbol: 'MNGD', name: 'Managed Assets', sector: 'Finance' },
  // --- Industrials Sector (55 new) ---
  { symbol: 'AGRM', name: 'Agro-Mechanics', sector: 'Industrials' },
  { symbol: 'BLST', name: 'Ballisti-Co', sector: 'Industrials' },
  { symbol: 'CNST', name: 'Construct-X', sector: 'Industrials' },
  { symbol: 'DFNS', name: 'Defense Dynamics', sector: 'Industrials' },
  { symbol: 'ELEC', name: 'Elec-Mech', sector: 'Industrials' },
  { symbol: 'FABR', name: 'Fabri-Corp', sector: 'Industrials' },
  { symbol: 'GLBL', name: 'Global-Trans', sector: 'Industrials' },
  { symbol: 'HVAC', name: 'HVAC-Pro', sector: 'Industrials' },
  { symbol: 'INFR', name: 'Infra-Build', sector: 'Industrials' },
  { symbol: 'JNT', name: 'Joint-Fab', sector: 'Industrials' },
  { symbol: 'KNMT', name: 'Kin-Metal', sector: 'Industrials' },
  { symbol: 'LBRC', name: 'Lubri-Co', sector: 'Industrials' },
  { symbol: 'MTRL', name: 'Materi-Ex', sector: 'Industrials' },
  { symbol: 'NVG', name: 'Navi-Gate Logistics', sector: 'Industrials' },
  { symbol: 'OPRT', name: 'Operate-Right', sector: 'Industrials' },
  { symbol: 'PMP', name: 'Pump-Works', sector: 'Industrials' },
  { symbol: 'QSTL', name: 'Quik-Steel', sector: 'Industrials' },
  { symbol: 'ROTO', name: 'Roto-Works', sector: 'Industrials' },
  { symbol: 'SHPNG', name: 'Ship-Right', sector: 'Industrials' },
  { symbol: 'TRBO', name: 'Turbo-Dyne', sector: 'Industrials' },
  { symbol: 'UTEC', name: 'Util-Tech', sector: 'Industrials' },
  { symbol: 'VLVE', name: 'Valve-Co', sector: 'Industrials' },
  { symbol: 'WELD', name: 'Weld-Right', sector: 'Industrials' },
  { symbol: 'XTRD', name: 'X-Trude', sector: 'Industrials' },
  { symbol: 'YRD', name: 'Yard-Works', sector: 'Industrials' },
  { symbol: 'ZNTH', name: 'Zenith Manufacturing', sector: 'Industrials' },
  { symbol: 'APLY', name: 'Applied Mechanics', sector: 'Industrials' },
  { symbol: 'BRNG', name: 'Bearing-Co', sector: 'Industrials' },
  { symbol: 'CRGO', name: 'Cargo-Lift', sector: 'Industrials' },
  { symbol: 'DURA', name: 'Dura-Frame', sector: 'Industrials' },
  { symbol: 'ENVR', name: 'Enviro-Solutions', sector: 'Industrials' },
  { symbol: 'FLTR', name: 'Filter-Pro', sector: 'Industrials' },
  { symbol: 'GRND', name: 'Grind-Well', sector: 'Industrials' },
  { symbol: 'HMLT', name: 'Hamlet Machinery', sector: 'Industrials' },
  { symbol: 'INDM', name: 'Indu-Mech', sector: 'Industrials' },
  { symbol: 'LOGS', name: 'Logist-X', sector: 'Industrials' },
  { symbol: 'MOLD', name: 'Mold-Right', sector: 'Industrials' },
  { symbol: 'NBLD', name: 'Nova-Build', sector: 'Industrials' },
  { symbol: 'PPR', name: 'Paper-Works', sector: 'Industrials' },
  { symbol: 'RIVT', name: 'Rivet-Co', sector: 'Industrials' },
  { symbol: 'SFTY', name: 'Safety-First', sector: 'Industrials' },
  { symbol: 'TOOL', name: 'Tool-Right', sector: 'Industrials' },
  { symbol: 'UTIL', name: 'Util-Max', sector: 'Industrials' },
  { symbol: 'VNT', name: 'Vent-Sys', sector: 'Industrials' },
  { symbol: 'WRHS', name: 'Ware-House Inc.', sector: 'Industrials' },
  { symbol: 'XPRT', name: 'X-Port', sector: 'Industrials' },
  { symbol: 'YACH', name: 'Yacht-Builders', sector: 'Industrials' },
  { symbol: 'ZINC', name: 'Zinc-Co', sector: 'Industrials' },
  { symbol: 'CAST', name: 'Cast-Iron Works', sector: 'Industrials' },
  { symbol: 'DRIL', name: 'Drill-Right', sector: 'Industrials' },
  { symbol: 'ENGN', name: 'Engi-Pro', sector: 'Industrials' },
  { symbol: 'FORG', name: 'Forge-Masters', sector: 'Industrials' },
  { symbol: 'GEAR', name: 'Gear-Works', sector: 'Industrials' },
  { symbol: 'HVY', name: 'Heavy-Lift', sector: 'Industrials' },
  { symbol: 'LATH', name: 'Lathe-Masters', sector: 'Industrials' },
];

export const ICONS = {
    play: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
    pause: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" /></svg>,
    reset: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm10.164 9.84a1 1 0 00-1.414-1.414l-1.414 1.414a1 1 0 001.414 1.414l1.414-1.414zM14 16a1 1 0 100 2h- телевизорa1 1 0 100-2h5z" clipRule="evenodd" /></svg>,
};
  
export const SIMULATION_SPEEDS = [
    { label: '1m/s', steps: 60 },
    { label: '15m/s', steps: 900 },
    { label: '30m/s', steps: 1800 },
    { label: '1h/s', steps: 3600 },
    { label: '3h/s', steps: 10800 },
    { label: '12h/s', steps: 43200 },
    { label: '1d/s', steps: 86400 },
    { label: '3d/s', steps: 259200 },
    { label: '1w/s', steps: 604800 },
];

export const MIN_INITIAL_STOCK_PRICE = 8;
export const MAX_INITIAL_STOCK_PRICE = 12;
export const INITIAL_HISTORY_LENGTH = 252; // Approx 1 year
export const HUMAN_INITIAL_INVESTOR_CASH = 1_000_000;
export const AI_INITIAL_INVESTOR_CASH = 100;
export const INFLATION_RATE = 0.02 / 365; // Daily inflation rate

export const TAX_CONSTANTS = {
  WASHINGTON_LTCG_RATE: 0.07,
  WASHINGTON_CG_EXEMPTION: 250000,
  LONG_TERM_HOLDING_PERIOD: 365, // days
};

export const WASHINGTON_B_AND_O_TAX_RATES_BY_SECTOR: Record<string, number> = {
  Technology: 0.00471,
  Health: 0.00484,
  Finance: 0.00484,
  Industrials: 0.00484,
  Energy: 0.00484,
  default: 0.00484,
};

export const MIN_CORPORATE_ACTION_INTERVAL = 20;
export const CORPORATE_ACTION_INTERVAL_RANGE = 30;
export const MIN_STOCK_SPLIT_PRICE = 250;
export const MAX_STOCK_SPLIT_PRICE = 1000;

export const CORPORATE_EVENTS_BY_SECTOR: Record<string, Record<'positive' | 'negative' | 'neutral', CorporateEventConfig[]>> = {
  Technology: {
    positive: [
      { name: "New Patent Approved", description: "A key patent for a new technology has been approved.", impact: 1.05, type: 'positive' },
      { name: "Successful AI Launch", description: "A new AI product launch exceeds all sales expectations.", impact: 1.08, type: 'positive' },
    ],
    negative: [
      { name: "Major Data Breach", description: "A significant data breach has compromised user data.", impact: 0.92, type: 'negative' },
      { name: "Antitrust Lawsuit", description: "Government files an antitrust lawsuit against the company.", impact: 0.90, type: 'negative' },
    ],
    neutral: [
      { name: "Routine Software Update", description: "A routine software update is released.", type: 'neutral' },
    ],
  },
  Health: {
    positive: [
      { name: "FDA Approval", description: "A new drug receives full FDA approval.", impact: 1.15, type: 'positive' },
    ],
    negative: [
      { name: "Failed Clinical Trial", description: "A promising drug fails its Phase III clinical trials.", impact: 0.80, type: 'negative' },
    ],
    neutral: [
        { name: "Medical Conference Presentation", description: "Company presents research at a major medical conference.", type: 'neutral' },
    ]
  },
  Energy: {
      positive: [
          { name: "New Oil Field Discovery", description: "A massive new oil field is discovered.", impact: 1.10, type: 'positive' },
      ],
      negative: [
          { name: "Oil Spill Incident", description: "An oil spill has caused significant environmental damage.", impact: 0.88, type: 'negative' },
      ],
      neutral: [
          { name: "Routine Maintenance Shutdown", description: "A refinery undergoes scheduled maintenance.", type: 'neutral' },
      ]
  },
  Finance: {
      positive: [
          { name: "Positive Earnings Surprise", description: "Quarterly earnings significantly beat analyst expectations.", impact: 1.07, type: 'positive' },
      ],
      negative: [
          { name: "SEC Investigation", description: "The SEC has opened an investigation into the company's accounting practices.", impact: 0.91, type: 'negative' },
      ],
      neutral: [
          { name: "New Branch Opening", description: "A new branch is opened in a major city.", type: 'neutral' },
      ]
  },
  Industrials: {
      positive: [
          { name: "Major Government Contract", description: "The company wins a large, multi-year government contract.", impact: 1.09, type: 'positive' },
      ],
      negative: [
          { name: "Factory Worker Strike", description: "Workers at a major factory have gone on strike.", impact: 0.94, type: 'negative' },
      ],
      neutral: [
          { name: "Supply Chain Optimization", description: "Company announces a new supply chain optimization plan.", type: 'neutral' },
      ]
  }
};

export const MACRO_EVENTS: CorporateEventConfig[] = [
    { name: "Interest Rate Hike", description: "The Federal Reserve unexpectedly raises interest rates.", impact: 0.98, type: 'negative' },
    { name: "Interest Rate Cut", description: "The Federal Reserve unexpectedly cuts interest rates.", impact: 1.02, type: 'positive' },
    { name: "Positive Jobs Report", description: "The national jobs report is much stronger than expected.", impact: 1.01, type: 'positive' },
    { name: "Geopolitical Tensions", description: "New geopolitical tensions flare up overseas.", impact: 0.99, type: 'negative' },
    { name: "Major Hurricane Forms", description: "A category 5 hurricane is threatening major coastal industrial zones, disrupting shipping and energy production.", impact: 0.985, type: 'disaster' },
    { name: "Key Trade Deal Signed", description: "A new international trade agreement is signed between major economic blocs, expected to boost exports and reduce tariffs.", impact: 1.015, type: 'political' },
    { name: "Snap Election Called", description: "A surprise election in a key G7 market introduces significant political uncertainty for the coming months.", impact: 0.99, type: 'political' },
    { name: "Massive Earthquake Strikes", description: "A powerful 7.8 magnitude earthquake has disrupted supply chains in a critical microchip manufacturing region.", impact: 0.97, type: 'disaster' },
    { name: "Government Infrastructure Bill", description: "A massive infrastructure spending bill is passed, promising to boost the Industrials and Energy sectors.", impact: 1.02, type: 'political' },
    { name: "Widespread Flooding", description: "Unprecedented flooding across key agricultural regions is expected to impact food prices and related industries.", impact: 0.99, type: 'disaster' },
];

export const INDICATOR_NEURONS = [
    'momentum_5d', 'momentum_10d', 'momentum_20d', 'momentum_50d', 'momentum_1d_vs_avg5d',
    'trend_price_vs_sma_10', 'trend_price_vs_sma_20', 'trend_price_vs_sma_50', 'trend_price_vs_sma_100', 'trend_price_vs_sma_200',
    'trend_sma_crossover_10_20', 'trend_sma_crossover_20_50', 'trend_sma_crossover_50_200',
    'trend_price_vs_ema_10', 'trend_price_vs_ema_20', 'trend_price_vs_ema_50',
    'trend_ema_crossover_10_20', 'trend_ema_crossover_20_50',
    'oscillator_rsi_7_contrarian', 'oscillator_rsi_14_contrarian', 'oscillator_rsi_21_contrarian',
    'oscillator_stochastic_k_14_contrarian',
    'volatility_bollinger_bandwidth_20', 'volatility_bollinger_percent_b_20',
    'macd_histogram',
    'volume_avg_20d_spike', 'volume_obv_trend_20d', 'volume_cmf_20',
    'volatility_atr_14'
];

const createNeuralNetwork = (layerSizes: number[], inputNeuronNames: string[]): NeuralNetwork => {
    // The layer sizes array should start with the number of inputs.
    return new NeuralNetwork(layerSizes, inputNeuronNames);
};

const STRATEGY_NAMES = ["Momentum Bot", "Value Seeker", "Quant Algo", "Risk Manager", "Trend Follower", "Contrarian", "Growth Chaser", "Index Follower", "Volatility Trader", "Sector Rotator", "Alpha Hunter"];

// Shuffle array in place
// Fix: Add a trailing comma to the generic type parameter list to disambiguate from a JSX tag for the TSX parser.
const shuffle = <T,>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const buildInvestors = (): InvestorConfig[] => {
    const aiInvestors: InvestorConfig[] = [];
    const inputLayerSize = INDICATOR_NEURONS.length;

    // 1. Generate 999 base AI investors
    for (let i = 0; i < 999; i++) {
        aiInvestors.push({
            id: `ai-${i + 1}`,
            name: `AI Trader #${i + 1}`,
            strategyName: STRATEGY_NAMES[i % STRATEGY_NAMES.length],
            strategy: {
                strategyType: 'hyperComplex',
                network: createNeuralNetwork([inputLayerSize, 10, 5, 1], INDICATOR_NEURONS), // Standard network
                riskAversion: 0.7 + Math.random() * 1.5, // 0.7 to 2.2
                tradeFrequency: Math.floor(1 + Math.random() * 14), // 1 to 15
                learningRate: 0.005 + Math.random() * 0.045 // 0.005 to 0.05
            }
        });
    }

    // 2. Shuffle to pick random investors for upgrades
    shuffle(aiInvestors);

    // 3. Upgrade Tiers
    // Tier 2: 10 Advanced Traders
    for (let i = 0; i < 10; i++) {
        const investor = aiInvestors[i];
        investor.name = `Advanced Trader #${i + 1}`;
        investor.strategyName = "Advanced Quantitative Strategy";
        const strategy = investor.strategy as HyperComplexInvestorStrategy;
        strategy.network = createNeuralNetwork([inputLayerSize, 15, 10, 5, 1], INDICATOR_NEURONS);
        strategy.learningRate *= 1.2; // Slightly faster learner
        strategy.riskAversion *= 0.9; // Slightly more risk-taking
    }

    // Tier 3: 5 Elite Traders (from the advanced 10)
    for (let i = 0; i < 5; i++) {
        const investor = aiInvestors[i];
        investor.name = `Elite Trader #${i + 1}`;
        investor.strategyName = "Elite Deep Learning Fund";
        const strategy = investor.strategy as HyperComplexInvestorStrategy;
        strategy.network = createNeuralNetwork([inputLayerSize, 20, 15, 10, 5, 1], INDICATOR_NEURONS);
        strategy.learningRate *= 1.2;
        strategy.riskAversion *= 0.9;
    }

    // Tier 4: 3 Master Traders (from the elite 5)
    for (let i = 0; i < 3; i++) {
        const investor = aiInvestors[i];
        investor.name = `Master Trader #${i + 1}`;
        investor.strategyName = "Grandmaster Algorithmic Trading";
        const strategy = investor.strategy as HyperComplexInvestorStrategy;
        strategy.network = createNeuralNetwork([inputLayerSize, 30, 25, 20, 15, 10, 1], INDICATOR_NEURONS);
        strategy.learningRate *= 1.2;
        strategy.riskAversion *= 0.9;
    }

    // Tier 5: The Oracle (from the master 3)
    const oracle = aiInvestors[0];
    oracle.name = "The Oracle";
    oracle.strategyName = "Singularity Fund";
    const oracleStrategy = oracle.strategy as HyperComplexInvestorStrategy;
    // A 7-layer network: 1 input, 5 hidden layers of 50 neurons, 1 output layer
    oracleStrategy.network = createNeuralNetwork([inputLayerSize, 50, 50, 50, 50, 50, 1], INDICATOR_NEURONS); 
    oracleStrategy.learningRate = 0.08; // Max learning rate
    oracleStrategy.riskAversion = 0.4; // Very aggressive

    // 4. Sort by ID to have a consistent order and add Human player
    aiInvestors.sort((a,b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
    
    const humanPlayer: InvestorConfig = {
        id: 'human-player',
        name: 'Human Player',
        isHuman: true,
        strategy: {
            strategyType: 'hyperComplex',
            network: createNeuralNetwork([inputLayerSize, 10, 5, 1], INDICATOR_NEURONS), // A base network for consistency
            riskAversion: 0,
            tradeFrequency: 0,
            learningRate: 0
        }
    };
    
    return [humanPlayer, ...aiInvestors];
};