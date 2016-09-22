var CircleCI = require('circleci');
var program = require('commander');
var https = require('https');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

program
    .version('0.0.11')
    .option('-t, --token [value]', '(Required) CircleCI Authentication Token')
    .option('-b, --buildnum <n>', 'Specify a build number, or we take latest', parseInt)
    .option('-u, --user [value]', '(Required) Build git repository username')
    .option('-p, --project [value]', '(Required) Build git repository project')
    .option('--branch [value]', 'Branch to get builds from')
    .option('--path [value]', 'Path of files to download')
    .option('--outputdir [value]', 'path of local output directory output artifacts defaults to "./"')
    .option('--config [value]', 'specify a json config')
    .option('--print-paths', 'print file paths')
program.parse(process.argv);
//check for required params

if(program.config){
    var config = require(path.resolve(process.cwd(), program.config));
    console.log(config);
}

if(!program.user || !program.project || !program.token){
    console.log(program.user, program.project);
    program.help(); 
}
var outputdir = program.outputdir || './';
var buildnum = program.buildnum; 
const ci = new CircleCI({
  auth: program.token
});

//console.log(program)

const params = {
    user : program.user,
    project : program.project,
    token: program.token,
    buildnum : program.buildnum,
    branch: program.branch,
    printPaths: program.printPaths
}

var downloadArtifacts = (filepath) => (artifacts) => {
    var downloads = [];
    if(!filepath){
        filepath = "";
    }
    artifacts.map((artifact) => {
        if(artifact.path.startsWith(filepath)){
            downloads.push(downloadArtifact(artifact.url, `${outputdir}${artifact.path.substring(filepath.length)}`))
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
                if(params.printPaths){
                    console.log(filepath);
                }
                return resolve(filepath);
            })
        });
    })
}

function getBuildArtifacts(params) {
    return  (build_num) =>{
        return ci.getBuildArtifacts({
            username: params.user,
            project: params.project,
            build_num: build_num
        })
    }
}

function resolveBuildNumber(params){
    if(typeof(params.buildnum) !== 'number'){
        return findLatestBuild(params);
    } else {
        return Promise.resolve(params.buildnum);
    }
}

function latestSuccess(builds){
    return new Promise((resolve, reject) => {
        var i = 0;
        for(i =0; i < builds.length; i++){
            if(builds[i].lifecycle === 'finished' && builds[i].outcome === 'success'){
                return resolve(builds[i].build_num);
            }
        }
        return reject('No valid builds found');
    })
}

function findLatestBuild(params){
    var paramsReturn = params;
    if(!params.branch){
        return ci.getBuilds({username: params.user, project: params.project}).then(latestSuccess);
    } else {
        return ci.getBranchBuilds({username: params.user, project: params.project, branch: params.branch}).then(latestSuccess)
    }
}


resolveBuildNumber(params)
    .then((buildNumber) => {
        console.log("Downloading Build", buildNumber);
        return buildNumber;
     })
    .then(getBuildArtifacts(params))
    .then(downloadArtifacts(program.path))
    .then((files)=>{
        console.log(`Finished wrote ${files.length} files`);
    })
    .catch((err)=>{
        console.error('Error while attempting to download artifacts: ');
        console.error(err);
    });
