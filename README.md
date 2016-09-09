# circle-get-artifact
Get all artifacts from the most recent successful Circle CI build or a subpath `path` from the artifacts and places them in a local directory `outputdir`

## Install

Circle get artifact can be installed using NPM.

`npm install -g circle-get-artifact`

## Usage

```
  Usage: circle-get-artifact [options]

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -t, --token [value]    (Required) CircleCI Authentication Token
    -b, --buildnum <n>     Specify a build number, or we take latest
    -u, --user [value]     (Required) Build git repository username
    -p, --project [value]  (Required) Build git repository project
    --branch [value]       Branch to get builds from
    --path [value]         Path of files to download
    --outputdir [value]    path of local output directory output artifacts defaults to .

```

###Example
```
 circle-get-artifact --token "abcdefg01234012301230123012301230123" --user "blueflag" --project "moneypenny" --branch "master" --path '/home/ubuntu/'
```

Create tokens using account settings page https://circleci.com/account/api 
