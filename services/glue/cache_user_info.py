# cache_user_info.py
# glue_export_dims_daily.py
import os, json, boto3, pandas as pd, awswrangler as wr
import psycopg2, urllib.parse as up
from datetime import datetime
import argparse

p = argparse.ArgumentParser()
p.add_argument("--GLUE_CONN", required=True, nargs="+")
p.add_argument("--BUCKET", required=True)
p.add_argument("--PREFIX", default="meeting-insights/cache/")
p.add_argument("--REGION", default=os.environ.get("AWS_REGION","ap-northeast-1"))
args,_ = p.parse_known_args()
GLUE_CONN = " ".join(args.GLUE_CONN)

glue = boto3.client("glue", region_name=args.REGION)

def get_conn_props(name):
    props = glue.get_connection(Name=name)["Connection"]["ConnectionProperties"]
    jdbc = props["JDBC_CONNECTION_URL"]; user, pw = props["USERNAME"], props["PASSWORD"]
    url  = "postgresql://" + jdbc.split("jdbc:postgresql://",1)[1]
    pu   = up.urlparse(url)
    return dict(host=pu.hostname, port=pu.port or 5432, db=(pu.path or "/vapor").lstrip("/") or "vapor",
                user=user, pw=pw)

c = get_conn_props(GLUE_CONN)
conn = psycopg2.connect(host=c["host"], port=c["port"], dbname=c["db"],
                        user=c["user"], password=c["pw"], sslmode="require")

# users + org_users (denormalized)
users = pd.read_sql("""
  SELECT u.id AS user_id,
         u.name,
         u.email,
         ou.organization_id,
         ou.job_title
  FROM organization_users ou
  JOIN users u ON u.id = ou.user_id
""", conn)

# pulse_members (membership map)
members = pd.read_sql("""
  SELECT pulse_id, user_id, role
  FROM pulse_members
""", conn)

conn.close()

dt = datetime.utcnow().strftime("%Y-%m-%d")
base = f"s3://{args.BUCKET}/{args.PREFIX}"
wr.s3.to_parquet(users,    path=f"{base}dim_users/dt={dt}/", dataset=True, mode="overwrite_partitions")
wr.s3.to_parquet(members,  path=f"{base}dim_pulse_members/dt={dt}/", dataset=True, mode="overwrite_partitions")
print(f"Wrote dim snapshots to s3://{args.BUCKET}/{args.PREFIX} (dt={dt})")