var CircleCI = require('circleci');
var program = require('commander');
var https = require('https');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

program
    .version('0.0.1')
    .option('-t, --token [value]', '(Required) CircleCI Authentication Token')
    .option('-b, --buildnum <n>', 'Specify a build number, or we take latest', parseInt)
    .option('-u, --user [value]', '(Required) Build git repository username')
    .option('-p, --project [value]', '(Required) Build git repository project')
    .option('--branch [value]', 'Branch to get builds from')
    .option('--path [value]', 'Path of files to download')
program.parse(process.argv);
//check for required params

if(!program.user || !program.project || !program.token){
    console.log(program.user, program.project);
    program.help(); 
}

var buildnum = program.buildnum; 
const ci = new CircleCI({
  auth: program.token
});

const params = {
    user : program.user,
    project : program.project,
    token: program.token,
    buildnum : program.buildnum
}



var downloadArtifacts = (filepath) => (artifacts) => {
    var downloads = [];
    if(!filepath){
        filepath = "";
    }
    artifacts.map((artifact) => {
        if(artifact.path.startsWith(filepath)){
            downloads.push(downloadArtifact(artifact.url, artifact.path.substring(filepath.length)))
        }
    });
    return Promise.all(downloads);
}

function downloadArtifact(artifactUrl, filepath){
    return new Promise((resolve, reject) => {
        mkdirp(path.dirname(filepath), function (err) {
            if (err){ 
                return reject(`cannot create path ${filepath} ${err}`);
            }
            var file = fs.createWriteStream(filepath);
            var url = `${artifactUrl}?circle-token=${params.token}`;
            var request = https.get(url, function(response) {
                response.pipe(file);
            });
            file.on('close', ()=>{
                console.log(filepath);
                return resolve(filepath);
            })
        });
    })
}

function getBuildArticats(params){
    return ci.getBuildArtifacts({
        username: params.user,
        project: params.project,
        build_num: params.buildnum
    })
}

function resolveBuildNumber(params){
    if(typeof(params.buildnum) !== 'number'){
        return findLatestBuild(params);
    } else {
        return Promise.resolve(params);
    }
}

function findLatestBuild(params){
    var paramsReturn = params;
    if(!params.branch){
        return ci.getBuilds({username: params.user, project: params.project}).then((builds)=>{
            paramsReturn.buildnum = builds[0].build_num;
            return Promise.resolve(paramsReturn);
        })
    } else {
        return ci.getBranchBuilds({username: params.user, project: params.project, branch: params.branch}).then((builds)=>{
            paramsReturn.buildnum = builds[0].build_num;
            return Promise.resolve(paramsReturn);
        });
    }
}


resolveBuildNumber(params)
    .then(getBuildArticats)
    .then(downloadArtifacts(program.path))
    .then((files)=>{
        console.log(`Finished wrote ${files.length} files`);
    })
    .catch((err)=>{
        console.error('Error while attempting to download artifacts: ');
        console.error(err);
    });