# !/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
extract data in WaveFront obj files so that you can load concrete numbers in JavaScript files to construct 3D models.
It is just a tool for programmers and it is not used by the html file so players can delete it safely.

Usage: python create_vertex_list filename1 [filename2 ...]

Ensure your obj file has all three: vertices, normals, and texture coordinates. The script will crash otherwise.
"""

import sys

__author__ = 'an anonymous classmate of mine'


def parse_file(filename):
    vertices = []
    normals = []
    tex_coordinate = []

    vertices_list = []
    normals_list = []
    tex_coordinate_list = []

    num_faces = 0
    # f_out = open(filename + ".vrtx_list", "w")

    with open(filename, "r") as f_in:
        for line in f_in:
            words = line.split()
            if len(words) > 2:
                if words[0] == "v":
                    vertices.append([words[1], words[2], words[3]])
                elif words[0] == "vn":
                    normals.append([words[1], words[2], words[3]])
                elif words[0] == "vt":
                    tex_coordinate.append([words[1], words[2]])
                elif words[0] == "f":
                    tokens_0 = words[1].split('/')
                    for i in range(2, len(words) - 1):
                        num_faces += 1
                        tokens_1 = words[i].split('/')
                        tokens_2 = words[i + 1].split('/')

                        vertices_list.extend(vertices[int(tokens_0[0]) - 1])
                        vertices_list.extend(vertices[int(tokens_1[0]) - 1])
                        vertices_list.extend(vertices[int(tokens_2[0]) - 1])

                        tex_coordinate_list.extend(tex_coordinate[int(tokens_0[1]) - 1])
                        tex_coordinate_list.extend(tex_coordinate[int(tokens_1[1]) - 1])
                        tex_coordinate_list.extend(tex_coordinate[int(tokens_2[1]) - 1])

                        normals_list.extend(normals[int(tokens_0[2]) - 1])
                        normals_list.extend(normals[int(tokens_1[2]) - 1])
                        normals_list.extend(normals[int(tokens_2[2]) - 1])

    # print("%d : %d" % (len(vertices_list), len(normals_list)))

    with open(filename + ".js", "w") as f_out:
        f_out.write("// Creating Output for %s\n\n" % (filename))
        f_out.write("var num_faces = %d;\n\n" % (num_faces))

        f_out.write("var vertices = [\n    ")
        for s in vertices_list:
            f_out.write(s + ", ")
        f_out.write("\n];\n\n")

        f_out.write("var normals = [\n    ")
        for s in normals_list:
            f_out.write(s + ", ")
        f_out.write("\n];\n\n")

        f_out.write("var tex_coordinate = [\n    ")
        for s in tex_coordinate_list:
            f_out.write(s + ", ")
        f_out.write("\n]\n\n")


def main(argv):
    if len(argv) < 1:
        print("Usage: %s filename1 [filename2 ...]" % (argv[0]))
        sys.exit()

    for i in range(0, len(argv)):
        filename = argv[i]
        # pprint(filename)
        tokens = filename.split(".")
        if len(tokens) >= 1 and tokens[len(tokens) - 1] == "obj":
            print("Parsing File : %s" % (filename))
            parse_file(filename)


if __name__ == '__main__':
    main(sys.argv[1:])