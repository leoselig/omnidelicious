// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
$.ajaxSetup({
	//dataType: 'json'
});
var posts = [];

chrome.storage.sync.get(['username', 'password'], function(data) {
	if(data.username && data.password) {
		login(data.username, data.password);
	}
});

window.login = function(username, password) {
	chrome.storage.sync.set({
		username: username,
		password: password
	});
	$.post('https://' + username + ':' + password + '@api.del.icio.us/v1/posts/all?red=api').done(function(data, resp, r) {
		var respPosts = data.getElementsByTagName('post');
		posts = [];
		for(var i = 0; i < respPosts.length; i++) {
			posts.push(
				{
					description: respPosts[i].getAttribute('description').toLowerCase(),
					tags: respPosts[i].getAttribute('tag').split(' '),
					href: respPosts[i].getAttribute('href')
				});
		}
	}).fail(function(a, b, c){alert('Delicious login failed');});
};

// This event is fired each time the user updates the text in the omnibox,
// as long as the extension's keyword mode is still active.
chrome.omnibox.onInputChanged.addListener(
	function(text, suggest) {
		console.log('inputChanged: ' + text);
		var suggests = [];
		text = text.toLowerCase();
		for(var i = 0; i < posts.length; i++) {
			var add = false;
			if(posts[i].description.indexOf(text) >= 0) {
				add = true;
			}
			else  {
				for(var j = 0; j < posts[i].tags.length; i++) {
					if(posts[i].tags[j].toLowerCase().indexOf(text) >= 0) {
						add = true;
						break;
					}
				}
			}
			if(add) {
				suggests.push({
					content: posts[i].description,
					description: posts[i].tags.join(', ')
				});
			}
		}
		suggest(suggests);
	});

// This event is fired with the user accepts the input in the omnibox.
chrome.omnibox.onInputEntered.addListener(
	function(text) {
		for(var i = 0; i < posts.length; i++) {
			if(posts[i].description.toLowerCase() == text) {
				chrome.tabs.getSelected(null, function(tab) {
					chrome.tabs.update(tab.id, {url: posts[i].href});
				});
				break;
			}
		}
	});