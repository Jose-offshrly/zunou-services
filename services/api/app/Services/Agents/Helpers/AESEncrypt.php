<?php

namespace App\Services\Agents\Helpers;

class AESEncrypt
{
    public static function encrypt($key, $plaintext)
    {
        $salt   = random_bytes(8);
        $salted = '';
        $dx     = '';

        while (strlen($salted) < 48) {
            $dx = md5($dx . $key . $salt, true);
            $salted .= $dx;
        }

        $key = substr($salted, 0, 32);
        $iv  = substr($salted, 32, 16);

        $encrypted = openssl_encrypt(
            $plaintext,
            'AES-256-CBC',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
        );

        $openSslFormat = 'Salted__' . $salt . $encrypted;

        $encrypted = base64_encode($openSslFormat);

        return $encrypted;
    }
}
