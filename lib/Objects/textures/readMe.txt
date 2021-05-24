Due to security problem, namely the cross-origin issue, you cannot load jpg files into native browser.

There are 3 ways to fix it
1. you can use following website to convert a picture to base64 javaScript files
http://graphics.cs.wisc.edu/Courses/559-f2015/Services/imagebundler/bundler.html
Then you can load them in your native browser. Here I use this method.
If you cannot use the Internet, you could just use image_base64.py written by me.

2. If you have your own web server, you can just use jpg files as long as the picture and JavaScript files have the same origin, which means they have the same protocol, domain name and port number.

3. You can upload your picture to websites supporting cross-origin resource sharing (CORS), such as Flickr. Then you could site the hyper link of your image in function init in rod.js.

