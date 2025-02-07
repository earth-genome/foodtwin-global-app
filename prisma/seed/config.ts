import path from "path";

export const POSTGRES_CONNECTION_STRING = process.env.DATABASE_URL;

export const FLOW_FILE_SIZE_LIMIT =
  parseInt(process.env.FLOW_FILE_SIZE_LIMIT_MB as string) * 1024 * 1024;

export const PUBLIC_PATH = path.resolve(process.env.PUBLIC_PATH || "public");

export const TILES_PATH = path.join(PUBLIC_PATH, "tiles");

export const SEED_DATA_PATH = path.resolve(
  process.env.SEED_DATA_PATH as string
);

const DEMOGRAPHIC_DATA_PATH = path.join(SEED_DATA_PATH, "Demographic Data");
const INFRASTRUCTURE_DATA_PATH = path.join(SEED_DATA_PATH, "Infrastructure");
const MARITIME_INFRASTRUCTURE_DATA_PATH = path.join(
  INFRASTRUCTURE_DATA_PATH,
  "maritime"
);

export const ADMIN_CENTROIDS_PATH = path.join(
  DEMOGRAPHIC_DATA_PATH,
  "admin_centroids.gpkg"
);
export const ADMIN_LIMITS_PATH = path.join(
  DEMOGRAPHIC_DATA_PATH,
  "admin_polygons.gpkg"
);
export const ADMIN_LIMITS_TABLENAME = "admin_polygons";

export const ADMIN_INDICATORS_PATH = path.join(
  DEMOGRAPHIC_DATA_PATH,
  "demographics_economics_by_admin1region.csv"
);

export const INLAND_PORTS_PATH = path.join(
  INFRASTRUCTURE_DATA_PATH,
  `IWWNodes_infrastructure.gpkg`
);
export const INLAND_PORTS_TABLENAME = "IWWNodes_infrastructure";

export const ROAD_NODES_CSV_PATH = path.join(
  INFRASTRUCTURE_DATA_PATH,
  `RoadNodes_infrastructure.csv`
);

export const RAIL_STATIONS_PATH = path.join(
  INFRASTRUCTURE_DATA_PATH,
  `RailNodes_infrastructure.gpkg`
);
export const RAIL_STATIONS_TABLENAME = "RailNodes_infrastructure";
export const NODES_MARITIME_FILE = "nodes_maritime.gpkg";
export const NODES_MARITIME_TABLENAME = "nodes_maritime";
export const NODES_MARITIME_PATH = path.join(
  MARITIME_INFRASTRUCTURE_DATA_PATH,
  NODES_MARITIME_FILE
);

export const EDGE_IDS_SQLITE_DB_PATH = path.join(SEED_DATA_PATH, "edges_id.db");
export const EDGES_LAND_FILE = path.join(
  INFRASTRUCTURE_DATA_PATH,
  "Geometry_Landmapping_hexcode_complete.csv"
);
export const EDGES_LAND_FILE_TEMP = path.join(
  SEED_DATA_PATH,
  "edges_land_temp.csv"
);

export const EDGES_MARITIME_FILE = "edges_maritime_corrected_12172024.gpkg";
export const EDGES_MARITIME_TABLENAME = "maritime_edges";
export const EDGES_MARITIME_PATH = path.join(
  MARITIME_INFRASTRUCTURE_DATA_PATH,
  EDGES_MARITIME_FILE
);

export const FOOD_GROUPS_LIST_FILE = path.join(
  SEED_DATA_PATH,
  "Commodity",
  "fg1_fg2_fg3_lookup.csv"
);

export const FLOWS_FOLDER = path.join(SEED_DATA_PATH, "Flows");
