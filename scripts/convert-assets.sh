#!/usr/bin/env bash
set -euo pipefail

source_dir="assets/source-images/august-2026"
output_dir="public/images/struktur-v2"

mkdir -p "$output_dir"/{brands,moto,editorial,shop,products,lookbook}

ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_01 (4).png" -c:v libwebp -quality 80 "$output_dir/brands/struktur-brand-new-amsterdam.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_01 (5).png" -c:v libwebp -quality 80 "$output_dir/moto/struktur-moto-orange-editorial.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_05 (1).png" -c:v libwebp -quality 80 "$output_dir/editorial/struktur-editorial-grey-jacket.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_06 (2).png" -c:v libwebp -quality 80 "$output_dir/shop/struktur-shop-foosball.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_06 (3).png" -c:v libwebp -quality 80 "$output_dir/shop/struktur-shop-interior-wide-2.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_07 (4).png" -c:v libwebp -quality 80 "$output_dir/products/struktur-product-sneaker-saucony-display.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_07 (5).png" -c:v libwebp -quality 80 "$output_dir/editorial/struktur-editorial-black-sweater.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_15.png" -c:v libwebp -quality 80 "$output_dir/products/struktur-product-oas-patterned-set.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_25 (1).png" -c:v libwebp -quality 80 "$output_dir/products/struktur-product-sneaker-saucony-display-2.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_25 (2).png" -c:v libwebp -quality 80 "$output_dir/products/struktur-product-denim-jacket.webp"
ffmpeg -y -i "$source_dir/ChatGPT Image 20 août 2026, 13_21_26 (3).png" -c:v libwebp -quality 80 "$output_dir/lookbook/struktur-lifestyle-scooter.webp"
