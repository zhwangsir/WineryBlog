---
title: Getting started 
category: 参考资料
source: `https://riverpod.dev/docs/introduction/getting_started`
summary: 本地镜像：Riverpod 官方文档概览（原文 riverpod.dev）
---

> 本文档为站内参考资料，抓取自原文并整理，供离线学习。原文：`https://riverpod.dev/docs/introduction/getting_started`

## Try Riverpod online​

To get a feel of Riverpod, try it online on Dartpad:

## Installing the package​

Riverpod comes as a main "riverpod" package that’s self-sufficient, complemented by optional packages for using code generation (About code generation) and hooks (About hooks).

Once you know what package(s) you want to install, proceed to add the dependency to your app in a single line like this:

*   Flutter
*   Dart only

*   riverpod
*   riverpod + flutter_hooks
*   riverpod_generator
*   riverpod_generator + flutter_hooks

`flutter pub add material_uiflutter pub add flutter_riverpod`

Alternatively, you can manually add the dependency to your app from within your `pubspec.yaml`:

*   Flutter
*   Dart only

*   riverpod
*   riverpod + flutter_hooks
*   riverpod_generator
*   riverpod_generator + flutter_hooks

pubspec.yaml

`name: my_app_nameenvironment:  sdk: ^3.12.0  flutter: ">=3.44.0"dependencies:  flutter:    sdk: flutter  material_ui: ^1.0.0  flutter_riverpod: ^3.5.0`

Then, install packages with `flutter pub get`.

info

If using code-generation, you can now run the code-generator with:

`dart run build_runner watch -d`

That's it. You've added Riverpod to your app!

## Enabling riverpod_lint​

Riverpod comes with an optional riverpod_lint package that provides lint rules to help you write better code, and provide custom refactoring options.

Riverpod_lint is implemented using analysis_server_plugin. As such, it is installed through `analysis_options.yaml`

Long story short, create an `analysis_options.yaml` next to your `pubspec.yaml` and add:

analysis_options.yaml

`plugins:  riverpod_lint: <latest version from ``https://pub.dev/packages/riverpod_lint``>`

You should now see warnings in your IDE if you made mistakes when using Riverpod in your codebase.

To see the full list of warnings and refactorings, head to the riverpod_lint page.

## Usage example: Hello world​

Now that we have installed Riverpod, we can start using it.

The following snippets showcase how to use our new dependency to make a "Hello world":

*   Flutter
*   Dart only

*   riverpod
*   riverpod + flutter_hooks
*   riverpod_generator
*   riverpod_generator + flutter_hooks

lib/main.dart

`import 'package:flutter_riverpod/flutter_riverpod.dart';import 'package:material_ui/material_ui.dart';// We create a "provider", which will store a value (here "Hello world").// By using a provider, this allows us to mock/override the value exposed.final helloWorldProvider = Provider((_) => 'Hello world');void main() {  runApp(    // For widgets to be able to read providers, we need to wrap the entire    // application in a "ProviderScope" widget.    // This is where the state of our providers will be stored.    ProviderScope(      child: MyApp(),    ),  );}// Extend ConsumerWidget instead of StatelessWidget, which is exposed by Riverpodclass MyApp extends ConsumerWidget {  @override  Widget build(BuildContext context, WidgetRef ref) {    final String value = ref.watch(helloWorldProvider);    return MaterialApp(      home: Scaffold(        appBar: AppBar(title: const Text('Example')),        body: Center(          child: Text(value),        ),      ),    );  }}`

Then, start the application with `flutter run`.  
This will render "Hello world" on your device.

## Going further: Installing code snippets​

If you are using `Flutter` and `VS Code` , consider using Flutter Riverpod Snippets

If you are using `Flutter` and `Android Studio` or `IntelliJ`, consider using Riverpod Gen Shortcuts OR Flutter Riverpod Snippets

**Example: Using Generator - Riverpod Stream (`riverpodStream`)**
（图：Image 1: riverpod-class）

**Example: Using Generator - Riverpod Class (`riverpodClassKeepAlive`)**
（图：Image 2: riverpod-stream）

**Flutter Riverpod Snippets**
（图：Image 3: img）
