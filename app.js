const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseDbServer = (dbObject) => {
    return{
        stateId: dbObject.state_id,
        stateName: dbObject.state_name,
        population: dbObject.population,
    };
};

const convertDistrictDbObjectToResponseDbObject = (dbObject) => {
    return{
        districtId: dbObject.district_id,
        districtName: dbObject.district_name,
        stateId: dbObject.state_id,
        cases: dbObject.cases,
        cured: dbObject.curved,
        active: dbObject.active,
        deaths: dbObject.deaths,
    };
};

app.get("/states/", async (request, response) => {
    const getStatesQuery = `
        SELECT
            *
        FROM
            state;`;
   const playersArray = await database.all(getStatesQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertStateDbObjectToResponseDbServer(eachPlayer)
    )
  );
})

app.get("/states/:stateId/", async (request, response) => {
    const { stateId } = request.params;
    const getStateQuery = `
    SELECT
        *
    FROM
        state
    WHERE
        state_id = ${stateId};`;
    const state = await database.get(getStateQuery);
    response.send(convertStateDbObjectToResponseDbServer(state));
})

app.post("/districts/", async (request, response) => {
    const { districtName, stateId, cases, cured, active, deaths } = request.body;
    const postDistrictsQuery = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES
        ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}) ;`;
    const districts = await database.run(postDistrictsQuery);
    response.send("District Successfully Added");
})

app.get("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const getDistrictQuery = `
    SELECT
        *
    FROM
        district
    WHERE
        district_id = ${districtId};`;
    const district = await database.get(getDistrictQuery);
    response.send(convertDistrictDbObjectToResponseDbObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params;
    const deleteQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;
    const districtDetail = await database.run(deleteQuery);
    response.send("District Removed");
})

app.put("/districts/:districtId/", async (request, response) => {
   
    const { districtName, stateId, cases, cured, active, deaths } = request.body;
    const { districtId } = request.params;
    const updateQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};`;
        const districtDetail = await database.run(updateQuery);
        response.send("District Details Updated");
})

app.get("/states/:stateId/stats/", async (request, response) => {
    const { stateId } = request.params;
    const getStatsQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM
        district
    WHERE
        state_id = ${stateId};`;
    const stats = await database.get(getStatsQuery);
   
    console.log(stats);
   
    response.send({
        totalCases: stats["SUM(cases)"],
        totalCured: stats["SUM(cured)"],
        totalActive: stats["SUM(active)"],
        totalDeaths: stats["SUM(deaths)"],
    });
});

app.get("/districts/:districtId/details/", async (request, response) => {
    const { districtId } = request.params;
    const getDetailQuery = `
    SELECT
        state_id
    FROM
        district
    WHERE
        district_id = ${districtId};`;
    const districtDetail = await database.get(getDetailQuery);

    const getStateNameQuery = `
    SELECT
        state_name as stateName
    FROM
        state
    WHERE
        state_id = ${districtDetail.state_id};`;
     const stateNameDetail = await database.get(getStateNameQuery);
        response.send(stateNameDetail);
});

module.exports = app;

//ccbp submit NJSCPAQLBE//