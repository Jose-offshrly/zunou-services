<?php

declare(strict_types=1);

namespace App\Support;

use App\Support\Attributes\MapTo;
use Illuminate\Support\Carbon;
use ReflectionClass;
use ReflectionNamedType;

abstract class Data
{
    public static function from(array $input): static
    {
        return static::resolve(static::class, $input);
    }

    public function all(): array
    {
        return get_object_vars($this);
    }

    public static function resolve(string $className, array $input): object
    {
        $reflection  = new ReflectionClass($className);
        $constructor = $reflection->getConstructor();

        if (! $constructor) {
            return new $className(); // no constructor? just instantiate.
        }

        $parameters = $constructor->getParameters();
        $args       = [];

        foreach ($parameters as $param) {
            $name = $param->getName();

            if (
                ! array_key_exists($name, $input) && ! $param->isDefaultValueAvailable()
            ) {
                throw new \InvalidArgumentException(
                    "Missing value for '$name'",
                );
            }

            $value = $input[$name] ?? $param->getDefaultValue();
            $type  = $param->getType();

            if ($type instanceof ReflectionNamedType) {
                $typeName = $type->getName();

                if (! $type->isBuiltin()) {
                    if ($typeName === Carbon::class || $typeName === 'Illuminate\\Support\\Carbon') {
                        // Ensure all Carbon instances are Illuminate\Support\Carbon
                        if ($value !== null) {
                            if (is_string($value)) {
                                $value = Carbon::parse($value);
                            } elseif ($value instanceof \Carbon\Carbon || $value instanceof \DateTimeInterface) {
                                $value = Carbon::parse($value);
                            }
                        }
                    } elseif (enum_exists($typeName)) {
                        // Handle backed enums (string/int)
                        $value = $typeName::from($value);
                    } elseif (is_array($value)) {
                        // Handle nested DTO
                        $value = self::resolve($typeName, $value);
                    }
                } elseif ($typeName === 'array') {
                    // array mapping (same logic as before)
                    $attrs = $param->getAttributes(MapTo::class);

                    if (! empty($attrs)) {
                        /** @var MapTo $mapTo */
                        $mapTo       = $attrs[0]->newInstance();
                        $nestedClass = $mapTo->class;

                        if (is_array($value)) {
                            $value = array_map(function ($item) use (
                                $nestedClass,
                                $name
                            ) {
                                if (is_array($item)) {
                                    return self::resolve($nestedClass, $item);
                                }

                                if (! $item instanceof $nestedClass) {
                                    throw new \InvalidArgumentException(
                                        "Invalid item in array '$name'; expected instance of $nestedClass.",
                                    );
                                }

                                return $item;
                            }, $value);
                        }
                    }
                }
            }
            $args[] = $value;
        }

        return $reflection->newInstanceArgs($args);
    }
}
