import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderItemDto {
  @IsString()
  productSlug!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderDto {
  @IsString()
  @MinLength(2, { message: "Укажите имя (минимум 2 символа)" })
  customerName!: string;

  @IsString()
  @MinLength(5, { message: "Укажите телефон для связи" })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: "Некорректный email" })
  email?: string;

  // "pickup" — самовывоз, "courier" — курьер/ТК (адрес обязателен,
  // проверяется в OrdersService, а не здесь, чтобы вернуть понятный текст ошибки).
  @IsIn(["pickup", "courier"])
  deliveryMethod!: "pickup" | "courier";

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  // Покупатель явно попросил оформить "в наличии" и "под заказ" раздельно
  // (двумя заказами со счётом-привязкой groupId), а не одним общим заказом.
  // Если в корзине товары только одного типа — флаг ни на что не влияет,
  // заказ создаётся один в любом случае (см. OrdersService.create).
  @IsOptional()
  @IsBoolean()
  splitByAvailability?: boolean;
}
