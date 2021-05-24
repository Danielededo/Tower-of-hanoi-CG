# !/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
convert pictures to base64 strings stored in a JavaScript file so that we can load texture in native browser.

It is just a tool for programmers and it is not used by the html file so players can delete it safely.

To use the output file add it as a script tag in the head. Make sure to add type="text/javascript"
The Image() object will then be accessible in the global object LoadedImageFiles[name_of_file]

Usage: python image_base64 filename1 [filename2 ...]

"""

import sys
import base64

__author__ = 'Nick Yang'


def parse_file(filename, type):

    with open(filename, "rb") as f_in:
        encoded_string = base64.b64encode(f_in.read())

    with open(filename + ".js", "w") as f_out:
        f_out.write("var LoadedImageFiles = LoadedImageFiles || {};\n")

        f_out.write("LoadedImageFiles[\"%s\"] = new Image();\n" % filename)

        if type == "jpg" or type == "jpeg":
            f_out.write("LoadedImageFiles[\"%s\"].src = \"data:image/jpeg;base64,%s\"\n" % (filename, encoded_string))
        elif type == "png":
            f_out.write("LoadedImageFiles[\"%s\"].src = \"data:image/png;base64,%s\"\n" % (filename, encoded_string))


def main(argv):
    if len(argv) < 1:
        print("Usage: %s filename1 [filename2 ...]" % (argv[0]))
        sys.exit()

    for i in range(0, len(argv)):
        filename = argv[i]
        tokens = filename.split(".")
        if len(tokens) >= 1 and (tokens[len(tokens) - 1] == "jpg" or tokens[len(tokens) - 1] == "jpeg"
                                 or tokens[len(tokens) - 1] == "png"):
            print("Parsing File : %s" % filename)
            parse_file(filename, tokens[len(tokens) - 1])


if __name__ == '__main__':
    main(sys.argv[1:])
