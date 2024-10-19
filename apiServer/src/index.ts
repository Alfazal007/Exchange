import { app } from "./app";
import { envVariables } from "./config/envVariables";
import 'dotenv/config';

app.listen(envVariables.port, ()=>{
    console.log(`App listening on port ${envVariables.port}`)
});

