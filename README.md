# 24syv-mass-downloader
Download all episodes for a podcast from 24syv before it closes

This is pretty hacky still but it works fine. Edit the `downloadPodcast` method if you don't want to download a whole podcast in one go.

`podcastId` can be found on 24syv.dk under "Podcasts". Choose your program. Shift between years/months whatever with the developer tools open. 
See the requests made to `https://api.radio24syv.dk/v2/podcasts/program/[0-9]+` (as an example with Fedeabes fyraften it would be: `https://api.radio24syv.dk/v2/podcasts/program/16512250?size=12&order=desc` - then the `podcastId` would be `16512250`)
