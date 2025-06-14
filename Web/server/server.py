from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import pandas as pd

app = Flask(__name__)
CORS(app)

# PostgreSQL (TimescaleDB) 연결 설정
conn = psycopg2.connect(
    host="localhost",       # ✅ AWS DB IP 주소
    port=5432,
    dbname="smartfarm",  # ✅ 실제 DB 이름으로 변경
    user="postgres",        # ✅ 유저 이름
    password="1234"     # ✅ 비밀번호
)

@app.route("/api/tomato-data")
def get_tomato_data():
    query = """
        SELECT 
            growth_stage,
            yield,
            avg_daily_temp,
            avg_week_humidity
        FROM crop_environment;
    """
    df = pd.read_sql(query, conn)

    # 문자열에 쉼표나 공백이 있을 가능성 제거
    df["yield"] = pd.to_numeric(df["yield"], errors="coerce")
    df["avg_daily_temp"] = pd.to_numeric(df["avg_daily_temp"], errors="coerce")
    df["avg_week_humidity"] = pd.to_numeric(df["avg_week_humidity"], errors="coerce")

    # 생육주기별 평균값 계산
    avg_df = df.groupby("growth_stage", as_index=False).agg({
        "yield": "mean",
        "avg_daily_temp": "mean",
        "avg_week_humidity": "mean"
    })

    # 컬럼 이름을 React에서 사용하는 것으로 변경
    avg_df.columns = ["growth_stage", "평균생산량", "평균온도", "평균습도"]

    return jsonify(avg_df.to_dict(orient="records"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
