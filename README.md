# circle-get-artifact
Get artifacts from Circle CI


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

```

###Example
```
 node index.js --token "abcdefg01234012301230123012301230123" --user "blueflag" --project "moneypenny" --branch "master" --path '/home/ubuntu/'
```

Create tokens using account settings page https://circleci.com/account/api 
